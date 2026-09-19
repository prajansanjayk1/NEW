import { StaffProfile, RestaurantTable } from '../types';
import { DEFAULT_STAFF_MEMBERS } from './staffAuthService';
import { DEMO_RESTAURANT_TABLES } from './tableSessionService';
import { getSupabaseClient } from './supabaseClient';

export interface TableHardwareConfig {
  tableNumber: string;
  nfcTagUid: string;
  qrToken: string;
  targetUrl: string;
  status: 'ACTIVE' | 'UNASSIGNED' | 'MAINTENANCE';
  lastScanned?: string;
}

export interface StaffBadgeConfig {
  staffId: string;
  staffName: string;
  role: string;
  email: string;
  nfcCardUid: string;
  qrBadgeToken: string;
  assignedAt: string;
  status: 'ACTIVE' | 'REVOKED';
}

const STORAGE_KEYS = {
  TABLE_HARDWARE: 'kow_table_hardware_config_v1',
  STAFF_HARDWARE: 'kow_staff_hardware_config_v1',
};

// Default seed hardware mappings
const DEFAULT_TABLE_HARDWARE: TableHardwareConfig[] = DEMO_RESTAURANT_TABLES.map((t) => ({
  tableNumber: t.tableNumber,
  nfcTagUid: `NFC-TAB-${t.tableNumber}`,
  qrToken: `KW-${t.tableNumber}-SECURE`,
  targetUrl: `/?table=${t.tableNumber}&token=KW-${t.tableNumber}-SECURE&nfc=NFC-TAB-${t.tableNumber}`,
  status: 'ACTIVE',
  lastScanned: 'Recently',
}));

const DEFAULT_STAFF_HARDWARE: StaffBadgeConfig[] = DEFAULT_STAFF_MEMBERS.map((s) => {
  const firstName = s.displayName.split(' ')[0].toUpperCase();
  return {
    staffId: s.id,
    staffName: s.displayName,
    role: s.role,
    email: s.email || '',
    nfcCardUid: `NFC-STAFF-${firstName}`,
    qrBadgeToken: `STAFF-QR-${firstName}`,
    assignedAt: '2026-01-15T10:00:00.000Z',
    status: 'ACTIVE',
  };
});

class HardwareService {
  private tableConfigs: TableHardwareConfig[] = [];
  private staffConfigs: StaffBadgeConfig[] = [];

  constructor() {
    this.loadConfigs();
  }

  private loadConfigs() {
    try {
      const savedTables = localStorage.getItem(STORAGE_KEYS.TABLE_HARDWARE);
      this.tableConfigs = savedTables ? JSON.parse(savedTables) : [...DEFAULT_TABLE_HARDWARE];
    } catch {
      this.tableConfigs = [...DEFAULT_TABLE_HARDWARE];
    }

    try {
      const savedStaff = localStorage.getItem(STORAGE_KEYS.STAFF_HARDWARE);
      this.staffConfigs = savedStaff ? JSON.parse(savedStaff) : [...DEFAULT_STAFF_HARDWARE];
    } catch {
      this.staffConfigs = [...DEFAULT_STAFF_HARDWARE];
    }
  }

  private saveConfigs() {
    try {
      localStorage.setItem(STORAGE_KEYS.TABLE_HARDWARE, JSON.stringify(this.tableConfigs));
      localStorage.setItem(STORAGE_KEYS.STAFF_HARDWARE, JSON.stringify(this.staffConfigs));
    } catch (e) {
      console.warn('[HardwareService] Local storage save failed', e);
    }
  }

  // --- Web NFC API Integration ---

  /**
   * Check if the client browser supports the Web NFC API
   */
  isWebNfcSupported(): boolean {
    return typeof window !== 'undefined' && 'NDEFReader' in window;
  }

  /**
   * Scan physical NFC tag with NDEFReader (available on Android Chrome / supported hardware)
   */
  async scanPhysicalTag(signal?: AbortSignal): Promise<{ success: boolean; serialNumber?: string; text?: string; error?: string }> {
    if (!this.isWebNfcSupported()) {
      return { success: false, error: 'Web NFC is not supported on this browser/OS. Please use Chrome on Android or test with Simulation mode.' };
    }

    try {
      // @ts-ignore - Web NFC standard
      const ndef = new window.NDEFReader();
      await ndef.scan({ signal });

      return new Promise((resolve) => {
        // @ts-ignore
        ndef.onreading = (event: any) => {
          const serialNumber = event.serialNumber || 'NFC-TAG-UNKNOWN';
          let text = '';
          if (event.message && event.message.records) {
            for (const record of event.message.records) {
              if (record.recordType === 'text') {
                const textDecoder = new TextDecoder(record.encoding || 'utf-8');
                text = textDecoder.decode(record.data);
              } else if (record.recordType === 'url') {
                const textDecoder = new TextDecoder();
                text = textDecoder.decode(record.data);
              }
            }
          }
          resolve({ success: true, serialNumber, text });
        };

        // @ts-ignore
        ndef.onreadingerror = () => {
          resolve({ success: false, error: 'Cannot read data from the NFC tag. Try bringing it closer.' });
        };
      });
    } catch (err: any) {
      return { success: false, error: err?.message || 'NFC Scan permission denied or unavailable' };
    }
  }

  /**
   * Write NDEF message to physical NFC tag (e.g. for programming table puck or staff badge)
   */
  async writePhysicalTag(urlOrText: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isWebNfcSupported()) {
      return { success: false, error: 'Web NFC is not supported on this device. Configuration saved locally.' };
    }

    try {
      // @ts-ignore
      const ndef = new window.NDEFReader();
      await ndef.write({
        records: [
          {
            recordType: 'url',
            data: urlOrText,
          },
        ],
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to write to NFC tag' };
    }
  }

  // --- Table Hardware Management ---

  getAllTableConfigs(): TableHardwareConfig[] {
    return [...this.tableConfigs];
  }

  getTableConfig(tableNumber: string): TableHardwareConfig | undefined {
    return this.tableConfigs.find((t) => t.tableNumber === tableNumber);
  }

  async assignTableHardware(
    tableNumber: string,
    nfcTagUid: string,
    qrToken: string
  ): Promise<{ success: boolean; config: TableHardwareConfig }> {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3050';
    const targetUrl = `${origin}/?table=${tableNumber}&token=${encodeURIComponent(qrToken)}&nfc=${encodeURIComponent(nfcTagUid)}`;

    const idx = this.tableConfigs.findIndex((t) => t.tableNumber === tableNumber);
    const updated: TableHardwareConfig = {
      tableNumber,
      nfcTagUid: nfcTagUid.trim().toUpperCase(),
      qrToken: qrToken.trim().toUpperCase(),
      targetUrl,
      status: 'ACTIVE',
      lastScanned: 'Just assigned',
    };

    if (idx >= 0) {
      this.tableConfigs[idx] = updated;
    } else {
      this.tableConfigs.push(updated);
    }

    this.saveConfigs();

    // Supabase sync if connected
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('DEMO_RESTAURANT_TABLES')
          .update({
            qr_code_url: targetUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('table_number', tableNumber);
      } catch (err) {
        console.warn('[HardwareService] Supabase table update error:', err);
      }
    }

    return { success: true, config: updated };
  }

  // --- Staff Hardware Management ---

  getAllStaffConfigs(): StaffBadgeConfig[] {
    return [...this.staffConfigs];
  }

  getStaffConfig(staffId: string): StaffBadgeConfig | undefined {
    return this.staffConfigs.find((s) => s.staffId === staffId);
  }

  async assignStaffHardware(
    staffId: string,
    nfcCardUid: string,
    qrBadgeToken: string
  ): Promise<{ success: boolean; config: StaffBadgeConfig }> {
    const staff = DEFAULT_STAFF_MEMBERS.find((s) => s.id === staffId);
    const idx = this.staffConfigs.findIndex((s) => s.staffId === staffId);

    const updated: StaffBadgeConfig = {
      staffId,
      staffName: staff?.displayName || 'Staff Member',
      role: staff?.role || 'STAFF',
      email: staff?.email || '',
      nfcCardUid: nfcCardUid.trim().toUpperCase(),
      qrBadgeToken: qrBadgeToken.trim().toUpperCase(),
      assignedAt: new Date().toISOString(),
      status: 'ACTIVE',
    };

    if (idx >= 0) {
      this.staffConfigs[idx] = updated;
    } else {
      this.staffConfigs.push(updated);
    }

    this.saveConfigs();
    return { success: true, config: updated };
  }

  /**
   * Verify an incoming NFC or QR token from customer or staff
   */
  resolveHardwareTag(tag: string): {
    type: 'TABLE' | 'STAFF' | 'UNKNOWN';
    tableConfig?: TableHardwareConfig;
    staffConfig?: StaffBadgeConfig;
  } {
    const clean = tag.trim().toUpperCase();

    // Check staff tags
    const staffMatch = this.staffConfigs.find(
      (s) => s.nfcCardUid === clean || s.qrBadgeToken === clean || clean.includes(s.nfcCardUid) || clean.includes(s.qrBadgeToken)
    );
    if (staffMatch) {
      return { type: 'STAFF', staffConfig: staffMatch };
    }

    // Check table tags
    const tableMatch = this.tableConfigs.find(
      (t) => t.nfcTagUid === clean || t.qrToken === clean || clean.includes(t.nfcTagUid) || clean.includes(t.qrToken)
    );
    if (tableMatch) {
      return { type: 'TABLE', tableConfig: tableMatch };
    }

    return { type: 'UNKNOWN' };
  }
}

export const hardwareService = new HardwareService();