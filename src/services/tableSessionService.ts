import { 
  Restaurant, 
  RestaurantTable, 
  TableSession, 
  SessionParticipant, 
  SessionStatus 
} from '../types';

export const DEMO_FLAGSHIP_RESTAURANT: Restaurant = {
  id: 'rest-kow-blr-01',
  name: 'Kings of Wings',
  slug: 'kings-of-wings',
  logo: '🍗',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  currencySymbol: '₹',
  branch: 'Downtown High St.',
  address: 'Kings of Wings Flagship, 42 Grill Ave, Indiranagar, Bengaluru, 560038',
  phone: '+91 80 4912 3456',
  email: 'table18@kingsofwings.menu',
  wifiSsid: 'KingsOfWings_5G',
  wifiPassword: 'SmokyGlaze2024',
  settings: {
    gstPercent: 5,
    allowEqualSplit: true,
    allowItemSplit: true,
    requireHostApproval: false,
  },
};

export const DEMO_RESTAURANT_TABLES: RestaurantTable[] = [
  { id: 'tbl-01', restaurantId: 'rest-kow-blr-01', tableNumber: '01', capacity: 2, zone: 'Window Bay', status: 'AVAILABLE' },
  { id: 'tbl-04', restaurantId: 'rest-kow-blr-01', tableNumber: '04', capacity: 4, zone: 'Central Dining', status: 'OCCUPIED' },
  { id: 'tbl-07', restaurantId: 'rest-kow-blr-01', tableNumber: '07', capacity: 6, zone: 'Main Floor', status: 'ORDERING' },
  { id: 'tbl-12', restaurantId: 'rest-kow-blr-01', tableNumber: '12', capacity: 4, zone: 'High St Patio', status: 'AVAILABLE' },
  { id: 'tbl-18', restaurantId: 'rest-kow-blr-01', tableNumber: '18', capacity: 6, zone: 'The Pit VIP', status: 'ORDERING' },
  { id: 'tbl-21', restaurantId: 'rest-kow-blr-01', tableNumber: '21', capacity: 8, zone: 'Private Booths', status: 'BILL_REQUESTED' },
];

export const DEMO_INITIAL_TABLE_SESSION: TableSession = {
  id: 'session-tbl18-live',
  restaurantId: 'rest-kow-blr-01',
  tableId: 'tbl-18',
  tableNumber: '18',
  sessionToken: '#KW-818',
  status: 'ORDERING',
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
  participants: [
    {
      id: 'p-jake',
      sessionId: 'session-tbl18-live',
      displayName: 'Jake Davis (Host)',
      avatarEmoji: '👑',
      initials: 'JD',
      color: 'bg-primary text-white',
      role: 'HOST',
      joinedAt: new Date().toISOString(),
      isActive: true,
      isCurrentDevice: true,
      itemCount: 1,
    },
    {
      id: 'p-aria',
      sessionId: 'session-tbl18-live',
      displayName: 'Aria Miller',
      avatarEmoji: '🔥',
      initials: 'AM',
      color: 'bg-secondary text-white',
      role: 'GUEST',
      joinedAt: new Date().toISOString(),
      isActive: true,
      isCurrentDevice: false,
      itemCount: 1,
    },
    {
      id: 'p-rohan',
      sessionId: 'session-tbl18-live',
      displayName: 'Rohan Kumar',
      avatarEmoji: '⚡',
      initials: 'RK',
      color: 'bg-amber-600 text-white',
      role: 'GUEST',
      joinedAt: new Date().toISOString(),
      isActive: true,
      isCurrentDevice: false,
      itemCount: 1,
    },
  ],
  currentOrderIds: ['ord-18-01'],
};

export const tableSessionService = {
  getRestaurant(): Restaurant {
    return DEMO_FLAGSHIP_RESTAURANT;
  },
  getAllTables(): RestaurantTable[] {
    return DEMO_RESTAURANT_TABLES;
  },
  getTableById(id: string): RestaurantTable | undefined {
    return DEMO_RESTAURANT_TABLES.find((t) => t.id === id);
  },
  getTableByNumber(tableNumber: string): RestaurantTable | undefined {
    return DEMO_RESTAURANT_TABLES.find((t) => t.tableNumber === tableNumber);
  },
  joinTableSession(session: TableSession, displayName: string, avatarEmoji: string = '🍗') {
    const initials = displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    const colors = [
      'bg-primary text-white',
      'bg-secondary text-white',
      'bg-emerald-600 text-white',
      'bg-amber-600 text-white',
      'bg-purple-600 text-white',
    ];
    const color = colors[session.participants.length % colors.length];
    const newParticipant: SessionParticipant = {
      id: `p-${Date.now().toString(36)}`,
      sessionId: session.id,
      displayName,
      avatarEmoji,
      initials: initials || 'G',
      color,
      role: 'GUEST',
      joinedAt: new Date().toISOString(),
      isActive: true,
      isCurrentDevice: true,
      itemCount: 0,
    };
    const updatedSession: TableSession = {
      ...session,
      participants: [...session.participants, newParticipant],
    };
    return { session: updatedSession, participant: newParticipant };
  },
  updateSessionStatus(session: TableSession, newStatus: SessionStatus): TableSession {
    return {
      ...session,
      status: newStatus,
    };
  },
  validateTableSession(slug: string, token: string) {
    if (!token || token.trim().length === 0) {
      return { isValid: false, error: 'INVALID_TOKEN', errorMessage: 'Table QR code or token cannot be empty' };
    }
    const cleanToken = token.trim().toUpperCase();
    if (cleanToken.includes('EXPIRED')) {
      return { isValid: false, error: 'EXPIRED', errorMessage: 'This table session has expired. Please ask staff.' };
    }
    if (cleanToken.includes('CLOSED')) {
      return { isValid: false, error: 'CLOSED', errorMessage: 'This table session has been settled and closed.' };
    }
    return {
      isValid: true,
      session: {
        ...DEMO_INITIAL_TABLE_SESSION,
        sessionToken: cleanToken.startsWith('#') ? cleanToken : `#${cleanToken}`,
      },
    };
  },
};
