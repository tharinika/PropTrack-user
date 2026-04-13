export const mockProperties = [
  {
    id: 'greenwood-1',
    name: 'Greenwood Apartments',
    address: '123 Oak Street, Downtown',
    totalUnits: 24,
    occupiedUnits: 22,
    createdAt: '2025-12-15T10:30:00Z', // Added last month
    propertyCharges: {
      maintenanceFee: 1500, // ₹1500
      waterBill: 500, // ₹500
      gasBill: 300 // ₹300
    },
    units: [
      { id: 'unit-1', number: 'A-101', status: 'occupied' as const, tenant: 'Sarah Miller', tenantId: 'tenant-1', rent: 12000, monthlyElectricity: 700 },
      { id: 'unit-2', number: 'A-102', status: 'vacant' as const, rent: 12000, monthlyElectricity: 0 },
      { id: 'unit-3', number: 'A-103', status: 'occupied' as const, tenant: 'James Wilson', tenantId: '2', rent: 13500, monthlyElectricity: 750 },
      { id: 'unit-4', number: 'A-104', status: 'maintenance' as const, rent: 12000, monthlyElectricity: 0 },
      { id: 'unit-5', number: 'A-105', status: 'occupied' as const, tenant: 'Robert Chen', tenantId: '3', rent: 12000, monthlyElectricity: 650 },
      { id: 'unit-6', number: 'A-106', status: 'occupied' as const, tenant: 'Lisa Thompson', tenantId: '4', rent: 12500, monthlyElectricity: 720 },
      { id: 'unit-7', number: 'B-107', status: 'occupied' as const, tenant: 'David Martinez', tenantId: '5', rent: 13000, monthlyElectricity: 780 },
      { id: 'unit-8', number: 'B-108', status: 'occupied' as const, tenant: 'Jennifer White', tenantId: '6', rent: 12000, monthlyElectricity: 680 },
      { id: 'unit-9', number: 'B-109', status: 'occupied' as const, tenant: 'Kevin Park', tenantId: '7', rent: 13500, monthlyElectricity: 740 },
      { id: 'unit-10', number: 'B-110', status: 'occupied' as const, tenant: 'Amanda Foster', tenantId: '8', rent: 12500, monthlyElectricity: 700 },
      { id: 'unit-11', number: 'C-111', status: 'occupied' as const, tenant: 'Daniel Kim', tenantId: '9', rent: 12000, monthlyElectricity: 660 },
      { id: 'unit-12', number: 'C-112', status: 'occupied' as const, tenant: 'Michelle Garcia', tenantId: '10', rent: 13000, monthlyElectricity: 710 },
      { id: 'unit-13', number: 'C-113', status: 'occupied' as const, tenant: 'Christopher Lee', tenantId: '11', rent: 13500, monthlyElectricity: 760 },
      { id: 'unit-14', number: 'C-114', status: 'occupied' as const, tenant: 'Nicole Rodriguez', tenantId: '12', rent: 12000, monthlyElectricity: 650 },
      { id: 'unit-15', number: 'D-115', status: 'occupied' as const, tenant: 'Matthew Anderson', tenantId: '13', rent: 12500, monthlyElectricity: 710 },
      { id: 'unit-16', number: 'D-116', status: 'occupied' as const, tenant: 'Stephanie Taylor', tenantId: '14', rent: 13000, monthlyElectricity: 750 },
      { id: 'unit-17', number: 'D-117', status: 'occupied' as const, tenant: 'Ryan Thomas', tenantId: '15', rent: 12000, monthlyElectricity: 690 },
      { id: 'unit-18', number: 'D-118', status: 'occupied' as const, tenant: 'Lauren Jackson', tenantId: '16', rent: 13500, monthlyElectricity: 730 },
      { id: 'unit-19', number: 'E-119', status: 'occupied' as const, tenant: 'Jason Moore', tenantId: '17', rent: 12500, monthlyElectricity: 680 },
      { id: 'unit-20', number: 'E-120', status: 'occupied' as const, tenant: 'Ashley Martin', tenantId: '18', rent: 12000, monthlyElectricity: 720 },
      { id: 'unit-21', number: 'E-121', status: 'occupied' as const, tenant: 'Brian Harris', tenantId: '19', rent: 13000, monthlyElectricity: 770 },
      { id: 'unit-22', number: 'E-122', status: 'occupied' as const, tenant: 'Megan Clark', tenantId: '20', rent: 13500, monthlyElectricity: 710 },
      { id: 'unit-23', number: 'F-123', status: 'occupied' as const, tenant: 'Tyler Lewis', tenantId: '21', rent: 12000, monthlyElectricity: 670 },
      { id: 'unit-24', number: 'F-124', status: 'vacant' as const, rent: 12500, monthlyElectricity: 0 },
    ]
  },
  {
    id: '2',
    name: 'Riverside Towers',
    address: '456 River Road, Eastside',
    totalUnits: 36,
    occupiedUnits: 34,
    createdAt: '2026-01-05T14:20:00Z', // Added this month
    propertyCharges: {
      maintenanceFee: 200,
      waterBill: 60,
      gasBill: 40
    },
    units: [
      { id: '201', number: 'B-201', status: 'occupied' as const, tenant: 'Emily Davis', rent: 1500, monthlyElectricity: 110 },
      { id: '202', number: 'B-202', status: 'occupied' as const, tenant: 'Michael Brown', rent: 1500, monthlyElectricity: 105 },
      { id: '203', number: 'B-203', status: 'occupied' as const, tenant: 'Jessica Wilson', rent: 1550, monthlyElectricity: 115 },
      { id: '204', number: 'B-204', status: 'occupied' as const, tenant: 'Andrew Davis', rent: 1500, monthlyElectricity: 108 },
      { id: '205', number: 'B-205', status: 'occupied' as const, tenant: 'Rachel Green', rent: 1600, monthlyElectricity: 120 },
      { id: '206', number: 'B-206', status: 'vacant' as const, rent: 1500, monthlyElectricity: 0 },
      { id: '207', number: 'B-207', status: 'occupied' as const, tenant: 'Mark Johnson', rent: 1550, monthlyElectricity: 112 },
      { id: '208', number: 'B-208', status: 'occupied' as const, tenant: 'Olivia Martinez', rent: 1500, monthlyElectricity: 107 },
      { id: '209', number: 'C-209', status: 'occupied' as const, tenant: 'Jacob Thompson', rent: 1600, monthlyElectricity: 118 },
      { id: '210', number: 'C-210', status: 'occupied' as const, tenant: 'Emma Robinson', rent: 1550, monthlyElectricity: 113 },
      { id: '211', number: 'C-211', status: 'occupied' as const, tenant: 'William Scott', rent: 1500, monthlyElectricity: 109 },
      { id: '212', number: 'C-212', status: 'occupied' as const, tenant: 'Sophia Adams', rent: 1600, monthlyElectricity: 116 },
      { id: '213', number: 'C-213', status: 'occupied' as const, tenant: 'Alexander King', rent: 1550, monthlyElectricity: 111 },
      { id: '214', number: 'C-214', status: 'occupied' as const, tenant: 'Isabella Wright', rent: 1500, monthlyElectricity: 106 },
      { id: '215', number: 'D-215', status: 'occupied' as const, tenant: 'Benjamin Hall', rent: 1600, monthlyElectricity: 119 },
      { id: '216', number: 'D-216', status: 'occupied' as const, tenant: 'Charlotte Young', rent: 1550, monthlyElectricity: 114 },
      { id: '217', number: 'D-217', status: 'occupied' as const, tenant: 'Ethan Allen', rent: 1500, monthlyElectricity: 108 },
      { id: '218', number: 'D-218', status: 'occupied' as const, tenant: 'Ava Nelson', rent: 1600, monthlyElectricity: 117 },
      { id: '219', number: 'E-219', status: 'occupied' as const, tenant: 'Lucas Baker', rent: 1550, monthlyElectricity: 112 },
      { id: '220', number: 'E-220', status: 'occupied' as const, tenant: 'Mia Carter', rent: 1500, monthlyElectricity: 107 },
      { id: '221', number: 'E-221', status: 'occupied' as const, tenant: 'Mason Mitchell', rent: 1600, monthlyElectricity: 121 },
      { id: '222', number: 'E-222', status: 'occupied' as const, tenant: 'Harper Perez', rent: 1550, monthlyElectricity: 113 },
      { id: '223', number: 'F-223', status: 'occupied' as const, tenant: 'Logan Roberts', rent: 1500, monthlyElectricity: 109 },
      { id: '224', number: 'F-224', status: 'occupied' as const, tenant: 'Evelyn Turner', rent: 1600, monthlyElectricity: 118 },
      { id: '225', number: 'F-225', status: 'occupied' as const, tenant: 'Noah Phillips', rent: 1550, monthlyElectricity: 111 },
      { id: '226', number: 'F-226', status: 'occupied' as const, tenant: 'Abigail Campbell', rent: 1500, monthlyElectricity: 106 },
      { id: '227', number: 'G-227', status: 'occupied' as const, tenant: 'Elijah Parker', rent: 1600, monthlyElectricity: 119 },
      { id: '228', number: 'G-228', status: 'occupied' as const, tenant: 'Elizabeth Evans', rent: 1550, monthlyElectricity: 114 },
      { id: '229', number: 'G-229', status: 'occupied' as const, tenant: 'James Edwards', rent: 1500, monthlyElectricity: 108 },
      { id: '230', number: 'G-230', status: 'occupied' as const, tenant: 'Sofia Collins', rent: 1600, monthlyElectricity: 122 },
      { id: '231', number: 'H-231', status: 'occupied' as const, tenant: 'Samuel Stewart', rent: 1550, monthlyElectricity: 115 },
      { id: '232', number: 'H-232', status: 'occupied' as const, tenant: 'Victoria Morris', rent: 1500, monthlyElectricity: 107 },
      { id: '233', number: 'H-233', status: 'occupied' as const, tenant: 'Henry Rogers', rent: 1600, monthlyElectricity: 120 },
      { id: '234', number: 'H-234', status: 'occupied' as const, tenant: 'Grace Reed', rent: 1550, monthlyElectricity: 113 },
      { id: '235', number: 'I-235', status: 'occupied' as const, tenant: 'Sebastian Cook', rent: 1500, monthlyElectricity: 109 },
      { id: '236', number: 'I-236', status: 'vacant' as const, rent: 1600, monthlyElectricity: 0 },
    ]
  },
  {
    id: '3',
    name: 'Sunset Plaza',
    address: '789 Sunset Blvd, Westend',
    totalUnits: 18,
    occupiedUnits: 16,
    createdAt: '2025-11-20T09:15:00Z', // Added 2 months ago
    propertyCharges: {
      maintenanceFee: 120,
      waterBill: 45,
      gasBill: 25
    },
    units: [
      { id: '301', number: 'S-301', status: 'occupied' as const, tenant: 'Patrick Murphy', rent: 1400, monthlyElectricity: 98 },
      { id: '302', number: 'S-302', status: 'occupied' as const, tenant: 'Hannah Bell', rent: 1450, monthlyElectricity: 102 },
      { id: '303', number: 'S-303', status: 'occupied' as const, tenant: 'Nathan Brooks', rent: 1400, monthlyElectricity: 96 },
      { id: '304', number: 'S-304', status: 'occupied' as const, tenant: 'Zoe Sanders', rent: 1500, monthlyElectricity: 105 },
      { id: '305', number: 'S-305', status: 'vacant' as const, rent: 1400, monthlyElectricity: 0 },
      { id: '306', number: 'S-306', status: 'occupied' as const, tenant: 'Christian Hughes', rent: 1450, monthlyElectricity: 100 },
      { id: '307', number: 'S-307', status: 'occupied' as const, tenant: 'Lily Price', rent: 1400, monthlyElectricity: 97 },
      { id: '308', number: 'S-308', status: 'occupied' as const, tenant: 'Isaac Jenkins', rent: 1500, monthlyElectricity: 106 },
      { id: '309', number: 'S-309', status: 'occupied' as const, tenant: 'Chloe Barnes', rent: 1450, monthlyElectricity: 103 },
      { id: '310', number: 'S-310', status: 'occupied' as const, tenant: 'Caleb Ross', rent: 1400, monthlyElectricity: 95 },
      { id: '311', number: 'S-311', status: 'occupied' as const, tenant: 'Ella Henderson', rent: 1500, monthlyElectricity: 107 },
      { id: '312', number: 'S-312', status: 'occupied' as const, tenant: 'Owen Coleman', rent: 1450, monthlyElectricity: 101 },
      { id: '313', number: 'S-313', status: 'occupied' as const, tenant: 'Avery Patterson', rent: 1400, monthlyElectricity: 98 },
      { id: '314', number: 'S-314', status: 'occupied' as const, tenant: 'Dylan Ross', rent: 1500, monthlyElectricity: 104 },
      { id: '315', number: 'S-315', status: 'occupied' as const, tenant: 'Aria Morgan', rent: 1450, monthlyElectricity: 99 },
      { id: '316', number: 'S-316', status: 'occupied' as const, tenant: 'Carter Cooper', rent: 1400, monthlyElectricity: 96 },
      { id: '317', number: 'S-317', status: 'occupied' as const, tenant: 'Luna Bailey', rent: 1500, monthlyElectricity: 108 },
      { id: '318', number: 'S-318', status: 'vacant' as const, rent: 1450, monthlyElectricity: 0 },
    ]
  }
];

export const mockTenants = [
  // Greenwood Apartments (22 tenants)
  { id: 'tenant-1', name: 'Sarah Miller', email: 'sarah.miller@email.com', phone: '+1 (555) 123-4567', unit: 'A-101', property: 'Greenwood Apartments', leaseStart: '2024-01-15', leaseEnd: '2025-01-14', monthlyRent: 15000, paymentStatus: 'paid' as const, lastPayment: '2026-01-01' },
  { id: '2', name: 'James Wilson', email: 'james.wilson@email.com', phone: '+1 (555) 234-5678', unit: 'A-103', property: 'Greenwood Apartments', leaseStart: '2023-06-01', leaseEnd: '2025-05-31', monthlyRent: 1350, paymentStatus: 'pending' as const, lastPayment: '2025-12-01' },
  { id: '3', name: 'Robert Chen', email: 'robert.chen@email.com', phone: '+1 (555) 345-6789', unit: 'A-105', property: 'Greenwood Apartments', leaseStart: '2024-02-01', leaseEnd: '2026-01-31', monthlyRent: 1200, paymentStatus: 'paid' as const, lastPayment: '2026-01-02' },
  { id: '4', name: 'Lisa Thompson', email: 'lisa.thompson@email.com', phone: '+1 (555) 456-7890', unit: 'A-106', property: 'Greenwood Apartments', leaseStart: '2023-11-15', leaseEnd: '2025-11-14', monthlyRent: 1250, paymentStatus: 'paid' as const, lastPayment: '2026-01-03' },
  { id: '5', name: 'David Martinez', email: 'david.martinez@email.com', phone: '+1 (555) 567-8901', unit: 'B-107', property: 'Greenwood Apartments', leaseStart: '2024-04-01', leaseEnd: '2026-03-31', monthlyRent: 1300, paymentStatus: 'paid' as const, lastPayment: '2026-01-01' },
  { id: '6', name: 'Jennifer White', email: 'jennifer.white@email.com', phone: '+1 (555) 678-9012', unit: 'B-108', property: 'Greenwood Apartments', leaseStart: '2023-08-20', leaseEnd: '2025-08-19', monthlyRent: 1200, paymentStatus: 'paid' as const, lastPayment: '2026-01-04' },
  { id: '7', name: 'Kevin Park', email: 'kevin.park@email.com', phone: '+1 (555) 789-0123', unit: 'B-109', property: 'Greenwood Apartments', leaseStart: '2024-01-10', leaseEnd: '2026-01-09', monthlyRent: 1350, paymentStatus: 'pending' as const, lastPayment: '2025-12-10' },
  { id: '8', name: 'Amanda Foster', email: 'amanda.foster@email.com', phone: '+1 (555) 890-1234', unit: 'B-110', property: 'Greenwood Apartments', leaseStart: '2023-09-01', leaseEnd: '2025-08-31', monthlyRent: 1250, paymentStatus: 'paid' as const, lastPayment: '2026-01-02' },
  { id: '9', name: 'Daniel Kim', email: 'daniel.kim@email.com', phone: '+1 (555) 901-2345', unit: 'C-111', property: 'Greenwood Apartments', leaseStart: '2024-03-15', leaseEnd: '2026-03-14', monthlyRent: 1200, paymentStatus: 'paid' as const, lastPayment: '2026-01-01' },
  { id: '10', name: 'Michelle Garcia', email: 'michelle.garcia@email.com', phone: '+1 (555) 012-3456', unit: 'C-112', property: 'Greenwood Apartments', leaseStart: '2023-07-01', leaseEnd: '2025-06-30', monthlyRent: 1300, paymentStatus: 'paid' as const, lastPayment: '2026-01-03' },
  { id: '11', name: 'Christopher Lee', email: 'christopher.lee@email.com', phone: '+1 (555) 123-4568', unit: 'C-113', property: 'Greenwood Apartments', leaseStart: '2024-05-20', leaseEnd: '2026-05-19', monthlyRent: 1350, paymentStatus: 'paid' as const, lastPayment: '2026-01-02' },
  { id: '12', name: 'Nicole Rodriguez', email: 'nicole.rodriguez@email.com', phone: '+1 (555) 234-5679', unit: 'C-114', property: 'Greenwood Apartments', leaseStart: '2023-10-15', leaseEnd: '2025-10-14', monthlyRent: 1200, paymentStatus: 'overdue' as const, lastPayment: '2025-11-15' },
  { id: '13', name: 'Matthew Anderson', email: 'matthew.anderson@email.com', phone: '+1 (555) 345-6780', unit: 'D-115', property: 'Greenwood Apartments', leaseStart: '2024-02-10', leaseEnd: '2026-02-09', monthlyRent: 1250, paymentStatus: 'paid' as const, lastPayment: '2026-01-01' },
  { id: '14', name: 'Stephanie Taylor', email: 'stephanie.taylor@email.com', phone: '+1 (555) 456-7891', unit: 'D-116', property: 'Greenwood Apartments', leaseStart: '2023-12-01', leaseEnd: '2025-11-30', monthlyRent: 1300, paymentStatus: 'paid' as const, lastPayment: '2026-01-04' },
  { id: '15', name: 'Ryan Thomas', email: 'ryan.thomas@email.com', phone: '+1 (555) 567-8902', unit: 'D-117', property: 'Greenwood Apartments', leaseStart: '2024-06-15', leaseEnd: '2026-06-14', monthlyRent: 1200, paymentStatus: 'paid' as const, lastPayment: '2026-01-02' },
  { id: '16', name: 'Lauren Jackson', email: 'lauren.jackson@email.com', phone: '+1 (555) 678-9013', unit: 'D-118', property: 'Greenwood Apartments', leaseStart: '2023-08-01', leaseEnd: '2025-07-31', monthlyRent: 1350, paymentStatus: 'pending' as const, lastPayment: '2025-12-01' },
  { id: '17', name: 'Jason Moore', email: 'jason.moore@email.com', phone: '+1 (555) 789-0124', unit: 'E-119', property: 'Greenwood Apartments', leaseStart: '2024-01-20', leaseEnd: '2026-01-19', monthlyRent: 1250, paymentStatus: 'paid' as const, lastPayment: '2026-01-03' },
  { id: '18', name: 'Ashley Martin', email: 'ashley.martin@email.com', phone: '+1 (555) 890-1235', unit: 'E-120', property: 'Greenwood Apartments', leaseStart: '2023-11-01', leaseEnd: '2025-10-31', monthlyRent: 1200, paymentStatus: 'paid' as const, lastPayment: '2026-01-01' },
  { id: '19', name: 'Brian Harris', email: 'brian.harris@email.com', phone: '+1 (555) 901-2346', unit: 'E-121', property: 'Greenwood Apartments', leaseStart: '2024-04-10', leaseEnd: '2026-04-09', monthlyRent: 1300, paymentStatus: 'paid' as const, lastPayment: '2026-01-04' },
  { id: '20', name: 'Megan Clark', email: 'megan.clark@email.com', phone: '+1 (555) 012-3457', unit: 'E-122', property: 'Greenwood Apartments', leaseStart: '2023-09-15', leaseEnd: '2025-09-14', monthlyRent: 1350, paymentStatus: 'paid' as const, lastPayment: '2026-01-02' },
  { id: '21', name: 'Tyler Lewis', email: 'tyler.lewis@email.com', phone: '+1 (555) 123-4569', unit: 'F-123', property: 'Greenwood Apartments', leaseStart: '2024-07-01', leaseEnd: '2026-06-30', monthlyRent: 1200, paymentStatus: 'paid' as const, lastPayment: '2026-01-01' },

  // Riverside Towers (34 tenants)
  { id: '22', name: 'Emily Davis', email: 'emily.davis@email.com', phone: '+1 (555) 234-5670', unit: 'B-201', property: 'Riverside Towers', leaseStart: '2024-03-01', leaseEnd: '2026-02-28', monthlyRent: 1500, paymentStatus: 'paid' as const, lastPayment: '2026-01-05' },
  { id: '23', name: 'Michael Brown', email: 'michael.brown@email.com', phone: '+1 (555) 345-6781', unit: 'B-202', property: 'Riverside Towers', leaseStart: '2023-09-15', leaseEnd: '2025-09-14', monthlyRent: 1500, paymentStatus: 'overdue' as const, lastPayment: '2025-11-15' },
  { id: '24', name: 'Jessica Wilson', email: 'jessica.wilson@email.com', phone: '+1 (555) 456-7892', unit: 'B-203', property: 'Riverside Towers', leaseStart: '2024-01-15', leaseEnd: '2026-01-14', monthlyRent: 1550, paymentStatus: 'paid' as const, lastPayment: '2026-01-03' },
  { id: '25', name: 'Andrew Davis', email: 'andrew.davis@email.com', phone: '+1 (555) 567-8903', unit: 'B-204', property: 'Riverside Towers', leaseStart: '2023-11-20', leaseEnd: '2025-11-19', monthlyRent: 1500, paymentStatus: 'paid' as const, lastPayment: '2026-01-02' },
  { id: '26', name: 'Rachel Green', email: 'rachel.green@email.com', phone: '+1 (555) 678-9014', unit: 'B-205', property: 'Riverside Towers', leaseStart: '2024-05-01', leaseEnd: '2026-04-30', monthlyRent: 1600, paymentStatus: 'paid' as const, lastPayment: '2026-01-04' },
  { id: '27', name: 'Mark Johnson', email: 'mark.johnson@email.com', phone: '+1 (555) 789-0125', unit: 'B-207', property: 'Riverside Towers', leaseStart: '2024-02-10', leaseEnd: '2026-02-09', monthlyRent: 1550, paymentStatus: 'paid' as const, lastPayment: '2026-01-01' },
  { id: '28', name: 'Olivia Martinez', email: 'olivia.martinez@email.com', phone: '+1 (555) 890-1236', unit: 'B-208', property: 'Riverside Towers', leaseStart: '2023-08-01', leaseEnd: '2025-07-31', monthlyRent: 1500, paymentStatus: 'pending' as const, lastPayment: '2025-12-01' },
  { id: '29', name: 'Jacob Thompson', email: 'jacob.thompson@email.com', phone: '+1 (555) 901-2347', unit: 'C-209', property: 'Riverside Towers', leaseStart: '2024-06-15', leaseEnd: '2026-06-14', monthlyRent: 1600, paymentStatus: 'paid' as const, lastPayment: '2026-01-03' },
  { id: '30', name: 'Emma Robinson', email: 'emma.robinson@email.com', phone: '+1 (555) 012-3458', unit: 'C-210', property: 'Riverside Towers', leaseStart: '2023-10-10', leaseEnd: '2025-10-09', monthlyRent: 1550, paymentStatus: 'paid' as const, lastPayment: '2026-01-02' },
  { id: '31', name: 'William Scott', email: 'william.scott@email.com', phone: '+1 (555) 123-4570', unit: 'C-211', property: 'Riverside Towers', leaseStart: '2024-04-20', leaseEnd: '2026-04-19', monthlyRent: 1500, paymentStatus: 'paid' as const, lastPayment: '2026-01-04' },
  { id: '32', name: 'Sophia Adams', email: 'sophia.adams@email.com', phone: '+1 (555) 234-5671', unit: 'C-212', property: 'Riverside Towers', leaseStart: '2023-12-01', leaseEnd: '2025-11-30', monthlyRent: 1600, paymentStatus: 'paid' as const, lastPayment: '2026-01-01' },
  { id: '33', name: 'Alexander King', email: 'alexander.king@email.com', phone: '+1 (555) 345-6782', unit: 'C-213', property: 'Riverside Towers', leaseStart: '2024-07-15', leaseEnd: '2026-07-14', monthlyRent: 1550, paymentStatus: 'paid' as const, lastPayment: '2026-01-03' },
  { id: '34', name: 'Isabella Wright', email: 'isabella.wright@email.com', phone: '+1 (555) 456-7893', unit: 'C-214', property: 'Riverside Towers', leaseStart: '2023-09-20', leaseEnd: '2025-09-19', monthlyRent: 1500, paymentStatus: 'pending' as const, lastPayment: '2025-12-20' },
  { id: '35', name: 'Benjamin Hall', email: 'benjamin.hall@email.com', phone: '+1 (555) 567-8904', unit: 'D-215', property: 'Riverside Towers', leaseStart: '2024-03-10', leaseEnd: '2026-03-09', monthlyRent: 1600, paymentStatus: 'paid' as const, lastPayment: '2026-01-02' },
  { id: '36', name: 'Charlotte Young', email: 'charlotte.young@email.com', phone: '+1 (555) 678-9015', unit: 'D-216', property: 'Riverside Towers', leaseStart: '2023-11-05', leaseEnd: '2025-11-04', monthlyRent: 1550, paymentStatus: 'paid' as const, lastPayment: '2026-01-04' },
  { id: '37', name: 'Ethan Allen', email: 'ethan.allen@email.com', phone: '+1 (555) 789-0126', unit: 'D-217', property: 'Riverside Towers', leaseStart: '2024-05-25', leaseEnd: '2026-05-24', monthlyRent: 1500, paymentStatus: 'paid' as const, lastPayment: '2026-01-01' },
  { id: '38', name: 'Ava Nelson', email: 'ava.nelson@email.com', phone: '+1 (555) 890-1237', unit: 'D-218', property: 'Riverside Towers', leaseStart: '2023-08-15', leaseEnd: '2025-08-14', monthlyRent: 1600, paymentStatus: 'paid' as const, lastPayment: '2026-01-03' },
  { id: '39', name: 'Lucas Baker', email: 'lucas.baker@email.com', phone: '+1 (555) 901-2348', unit: 'E-219', property: 'Riverside Towers', leaseStart: '2024-01-05', leaseEnd: '2026-01-04', monthlyRent: 1550, paymentStatus: 'paid' as const, lastPayment: '2026-01-02' },
  { id: '40', name: 'Mia Carter', email: 'mia.carter@email.com', phone: '+1 (555) 012-3459', unit: 'E-220', property: 'Riverside Towers', leaseStart: '2023-10-20', leaseEnd: '2025-10-19', monthlyRent: 1500, paymentStatus: 'paid' as const, lastPayment: '2026-01-04' },
  { id: '41', name: 'Mason Mitchell', email: 'mason.mitchell@email.com', phone: '+1 (555) 123-4571', unit: 'E-221', property: 'Riverside Towers', leaseStart: '2024-06-01', leaseEnd: '2026-05-31', monthlyRent: 1600, paymentStatus: 'paid' as const, lastPayment: '2026-01-01' },
  { id: '42', name: 'Harper Perez', email: 'harper.perez@email.com', phone: '+1 (555) 234-5672', unit: 'E-222', property: 'Riverside Towers', leaseStart: '2023-12-15', leaseEnd: '2025-12-14', monthlyRent: 1550, paymentStatus: 'paid' as const, lastPayment: '2026-01-03' },
  { id: '43', name: 'Logan Roberts', email: 'logan.roberts@email.com', phone: '+1 (555) 345-6783', unit: 'F-223', property: 'Riverside Towers', leaseStart: '2024-04-05', leaseEnd: '2026-04-04', monthlyRent: 1500, paymentStatus: 'pending' as const, lastPayment: '2025-12-05' },
  { id: '44', name: 'Evelyn Turner', email: 'evelyn.turner@email.com', phone: '+1 (555) 456-7894', unit: 'F-224', property: 'Riverside Towers', leaseStart: '2023-09-01', leaseEnd: '2025-08-31', monthlyRent: 1600, paymentStatus: 'paid' as const, lastPayment: '2026-01-02' },
  { id: '45', name: 'Noah Phillips', email: 'noah.phillips@email.com', phone: '+1 (555) 567-8905', unit: 'F-225', property: 'Riverside Towers', leaseStart: '2024-02-20', leaseEnd: '2026-02-19', monthlyRent: 1550, paymentStatus: 'paid' as const, lastPayment: '2026-01-04' },
  { id: '46', name: 'Abigail Campbell', email: 'abigail.campbell@email.com', phone: '+1 (555) 678-9016', unit: 'F-226', property: 'Riverside Towers', leaseStart: '2023-11-10', leaseEnd: '2025-11-09', monthlyRent: 1500, paymentStatus: 'paid' as const, lastPayment: '2026-01-01' },
  { id: '47', name: 'Elijah Parker', email: 'elijah.parker@email.com', phone: '+1 (555) 789-0127', unit: 'G-227', property: 'Riverside Towers', leaseStart: '2024-07-01', leaseEnd: '2026-06-30', monthlyRent: 1600, paymentStatus: 'paid' as const, lastPayment: '2026-01-03' },
  { id: '48', name: 'Elizabeth Evans', email: 'elizabeth.evans@email.com', phone: '+1 (555) 890-1238', unit: 'G-228', property: 'Riverside Towers', leaseStart: '2023-08-25', leaseEnd: '2025-08-24', monthlyRent: 1550, paymentStatus: 'paid' as const, lastPayment: '2026-01-02' },
  { id: '49', name: 'James Edwards', email: 'james.edwards@email.com', phone: '+1 (555) 901-2349', unit: 'G-229', property: 'Riverside Towers', leaseStart: '2024-03-15', leaseEnd: '2026-03-14', monthlyRent: 1500, paymentStatus: 'paid' as const, lastPayment: '2026-01-04' },
  { id: '50', name: 'Sofia Collins', email: 'sofia.collins@email.com', phone: '+1 (555) 012-3460', unit: 'G-230', property: 'Riverside Towers', leaseStart: '2023-10-01', leaseEnd: '2025-09-30', monthlyRent: 1600, paymentStatus: 'paid' as const, lastPayment: '2026-01-01' },
  { id: '51', name: 'Samuel Stewart', email: 'samuel.stewart@email.com', phone: '+1 (555) 123-4572', unit: 'H-231', property: 'Riverside Towers', leaseStart: '2024-05-10', leaseEnd: '2026-05-09', monthlyRent: 1550, paymentStatus: 'paid' as const, lastPayment: '2026-01-03' },
  { id: '52', name: 'Victoria Morris', email: 'victoria.morris@email.com', phone: '+1 (555) 234-5673', unit: 'H-232', property: 'Riverside Towers', leaseStart: '2023-12-20', leaseEnd: '2025-12-19', monthlyRent: 1500, paymentStatus: 'overdue' as const, lastPayment: '2025-11-20' },
  { id: '53', name: 'Henry Rogers', email: 'henry.rogers@email.com', phone: '+1 (555) 345-6784', unit: 'H-233', property: 'Riverside Towers', leaseStart: '2024-06-25', leaseEnd: '2026-06-24', monthlyRent: 1600, paymentStatus: 'paid' as const, lastPayment: '2026-01-02' },
  { id: '54', name: 'Grace Reed', email: 'grace.reed@email.com', phone: '+1 (555) 456-7895', unit: 'H-234', property: 'Riverside Towers', leaseStart: '2023-09-10', leaseEnd: '2025-09-09', monthlyRent: 1550, paymentStatus: 'paid' as const, lastPayment: '2026-01-04' },
  { id: '55', name: 'Sebastian Cook', email: 'sebastian.cook@email.com', phone: '+1 (555) 567-8906', unit: 'I-235', property: 'Riverside Towers', leaseStart: '2024-04-15', leaseEnd: '2026-04-14', monthlyRent: 1500, paymentStatus: 'paid' as const, lastPayment: '2026-01-01' },

  // Sunset Plaza (16 tenants)
  { id: '56', name: 'Patrick Murphy', email: 'patrick.murphy@email.com', phone: '+1 (555) 678-9017', unit: 'S-301', property: 'Sunset Plaza', leaseStart: '2024-01-10', leaseEnd: '2026-01-09', monthlyRent: 1400, paymentStatus: 'paid' as const, lastPayment: '2026-01-02' },
  { id: '57', name: 'Hannah Bell', email: 'hannah.bell@email.com', phone: '+1 (555) 789-0128', unit: 'S-302', property: 'Sunset Plaza', leaseStart: '2023-11-15', leaseEnd: '2025-11-14', monthlyRent: 1450, paymentStatus: 'paid' as const, lastPayment: '2026-01-03' },
  { id: '58', name: 'Nathan Brooks', email: 'nathan.brooks@email.com', phone: '+1 (555) 890-1239', unit: 'S-303', property: 'Sunset Plaza', leaseStart: '2024-05-20', leaseEnd: '2026-05-19', monthlyRent: 1400, paymentStatus: 'paid' as const, lastPayment: '2026-01-01' },
  { id: '59', name: 'Zoe Sanders', email: 'zoe.sanders@email.com', phone: '+1 (555) 901-2350', unit: 'S-304', property: 'Sunset Plaza', leaseStart: '2023-08-05', leaseEnd: '2025-08-04', monthlyRent: 1500, paymentStatus: 'pending' as const, lastPayment: '2025-12-05' },
  { id: '60', name: 'Christian Hughes', email: 'christian.hughes@email.com', phone: '+1 (555) 012-3461', unit: 'S-306', property: 'Sunset Plaza', leaseStart: '2024-02-15', leaseEnd: '2026-02-14', monthlyRent: 1450, paymentStatus: 'paid' as const, lastPayment: '2026-01-04' },
  { id: '61', name: 'Lily Price', email: 'lily.price@email.com', phone: '+1 (555) 123-4573', unit: 'S-307', property: 'Sunset Plaza', leaseStart: '2023-10-20', leaseEnd: '2025-10-19', monthlyRent: 1400, paymentStatus: 'paid' as const, lastPayment: '2026-01-02' },
  { id: '62', name: 'Isaac Jenkins', email: 'isaac.jenkins@email.com', phone: '+1 (555) 234-5674', unit: 'S-308', property: 'Sunset Plaza', leaseStart: '2024-06-01', leaseEnd: '2026-05-31', monthlyRent: 1500, paymentStatus: 'paid' as const, lastPayment: '2026-01-01' },
  { id: '63', name: 'Chloe Barnes', email: 'chloe.barnes@email.com', phone: '+1 (555) 345-6785', unit: 'S-309', property: 'Sunset Plaza', leaseStart: '2023-12-10', leaseEnd: '2025-12-09', monthlyRent: 1450, paymentStatus: 'paid' as const, lastPayment: '2026-01-03' },
  { id: '64', name: 'Caleb Ross', email: 'caleb.ross@email.com', phone: '+1 (555) 456-7896', unit: 'S-310', property: 'Sunset Plaza', leaseStart: '2024-04-25', leaseEnd: '2026-04-24', monthlyRent: 1400, paymentStatus: 'paid' as const, lastPayment: '2026-01-04' },
  { id: '65', name: 'Ella Henderson', email: 'ella.henderson@email.com', phone: '+1 (555) 567-8907', unit: 'S-311', property: 'Sunset Plaza', leaseStart: '2023-09-15', leaseEnd: '2025-09-14', monthlyRent: 1500, paymentStatus: 'paid' as const, lastPayment: '2026-01-02' },
  { id: '66', name: 'Owen Coleman', email: 'owen.coleman@email.com', phone: '+1 (555) 678-9018', unit: 'S-312', property: 'Sunset Plaza', leaseStart: '2024-03-05', leaseEnd: '2026-03-04', monthlyRent: 1450, paymentStatus: 'paid' as const, lastPayment: '2026-01-01' },
  { id: '67', name: 'Avery Patterson', email: 'avery.patterson@email.com', phone: '+1 (555) 789-0129', unit: 'S-313', property: 'Sunset Plaza', leaseStart: '2023-11-20', leaseEnd: '2025-11-19', monthlyRent: 1400, paymentStatus: 'pending' as const, lastPayment: '2025-12-20' },
  { id: '68', name: 'Dylan Ross', email: 'dylan.ross@email.com', phone: '+1 (555) 890-1240', unit: 'S-314', property: 'Sunset Plaza', leaseStart: '2024-07-10', leaseEnd: '2026-07-09', monthlyRent: 1500, paymentStatus: 'paid' as const, lastPayment: '2026-01-03' },
  { id: '69', name: 'Aria Morgan', email: 'aria.morgan@email.com', phone: '+1 (555) 901-2351', unit: 'S-315', property: 'Sunset Plaza', leaseStart: '2023-08-25', leaseEnd: '2025-08-24', monthlyRent: 1450, paymentStatus: 'paid' as const, lastPayment: '2026-01-04' },
  { id: '70', name: 'Carter Cooper', email: 'carter.cooper@email.com', phone: '+1 (555) 012-3462', unit: 'S-316', property: 'Sunset Plaza', leaseStart: '2024-05-15', leaseEnd: '2026-05-14', monthlyRent: 1400, paymentStatus: 'paid' as const, lastPayment: '2026-01-02' },
  { id: '71', name: 'Luna Bailey', email: 'luna.bailey@email.com', phone: '+1 (555) 123-4574', unit: 'S-317', property: 'Sunset Plaza', leaseStart: '2023-10-01', leaseEnd: '2025-09-30', monthlyRent: 1500, paymentStatus: 'paid' as const, lastPayment: '2026-01-01' },
];

export const mockMaintenanceRequests = [
  {
    id: '1',
    title: 'Leaking faucet in kitchen',
    description: 'Kitchen sink faucet is leaking constantly, wasting water.',
    tenant: 'Sarah Miller',
    unit: 'A-101',
    property: 'Greenwood Apartments',
    category: 'Plumbing',
    priority: 'medium' as const,
    status: 'new' as const,
    createdAt: '2026-01-10',
    image: null
  },
  {
    id: '2',
    title: 'AC not cooling properly',
    description: 'Air conditioning unit is running but not cooling the apartment.',
    tenant: 'James Wilson',
    unit: 'A-103',
    property: 'Greenwood Apartments',
    category: 'HVAC',
    priority: 'high' as const,
    status: 'in-progress' as const,
    createdAt: '2026-01-08',
    image: null
  },
  {
    id: '3',
    title: 'Broken window lock',
    description: 'Bedroom window lock is broken, security concern.',
    tenant: 'Emily Davis',
    unit: 'B-201',
    property: 'Riverside Towers',
    category: 'Security',
    priority: 'high' as const,
    status: 'new' as const,
    createdAt: '2026-01-11',
    image: null
  },
  {
    id: '4',
    title: 'Light fixture not working',
    description: 'Living room ceiling light stopped working.',
    tenant: 'Michael Brown',
    unit: 'B-202',
    property: 'Riverside Towers',
    category: 'Electrical',
    priority: 'low' as const,
    status: 'completed' as const,
    createdAt: '2026-01-05',
    completedAt: '2026-01-09'
  },
  {
    id: '5',
    title: 'Dishwasher not draining',
    description: 'Water pools at the bottom after wash cycle completes.',
    tenant: 'Patrick Murphy',
    unit: 'S-301',
    property: 'Sunset Plaza',
    category: 'Appliances',
    priority: 'medium' as const,
    status: 'in-progress' as const,
    createdAt: '2026-01-09',
    image: null
  },
  {
    id: '6',
    title: 'Toilet running continuously',
    description: 'Bathroom toilet keeps running even after flush completes.',
    tenant: 'Robert Chen',
    unit: 'A-105',
    property: 'Greenwood Apartments',
    category: 'Plumbing',
    priority: 'medium' as const,
    status: 'new' as const,
    createdAt: '2026-01-12',
    image: null
  },
];

export const mockPayments = [
  // Recent payments from multiple properties
  { id: '1', tenant: 'Sarah Miller', property: 'Greenwood Apartments', amount: 15000, date: '2026-01-01', status: 'paid' as const, type: 'rent' as const, unit: 'A-101' },
  { id: '2', tenant: 'Emily Davis', property: 'Riverside Towers', amount: 1500, date: '2026-01-05', status: 'paid' as const, type: 'rent' as const, unit: 'B-201' },
  { id: '3', tenant: 'James Wilson', property: 'Greenwood Apartments', amount: 1350, date: '2026-01-12', status: 'pending' as const, type: 'rent' as const, unit: 'A-103' },
  { id: '4', tenant: 'Michael Brown', property: 'Riverside Towers', amount: 1500, date: '2025-12-01', status: 'overdue' as const, type: 'rent' as const, unit: 'B-202' },
  { id: '5', tenant: 'Patrick Murphy', property: 'Sunset Plaza', amount: 1400, date: '2026-01-02', status: 'paid' as const, type: 'rent' as const, unit: 'S-301' },
  { id: '6', tenant: 'Robert Chen', property: 'Greenwood Apartments', amount: 1200, date: '2026-01-02', status: 'paid' as const, type: 'rent' as const, unit: 'A-105' },
  { id: '7', tenant: 'Jessica Wilson', property: 'Riverside Towers', amount: 1550, date: '2026-01-03', status: 'paid' as const, type: 'rent' as const, unit: 'B-203' },
  { id: '8', tenant: 'Hannah Bell', property: 'Sunset Plaza', amount: 1450, date: '2026-01-03', status: 'paid' as const, type: 'rent' as const, unit: 'S-302' },
  { id: '9', tenant: 'Lisa Thompson', property: 'Greenwood Apartments', amount: 1250, date: '2026-01-03', status: 'paid' as const, type: 'rent' as const, unit: 'A-106' },
  { id: '10', tenant: 'Olivia Martinez', property: 'Riverside Towers', amount: 1500, date: '2026-01-01', status: 'pending' as const, type: 'rent' as const, unit: 'B-208' },
  { id: '11', tenant: 'Zoe Sanders', property: 'Sunset Plaza', amount: 1500, date: '2025-12-05', status: 'overdue' as const, type: 'rent' as const, unit: 'S-304' },
  { id: '12', tenant: 'Nicole Rodriguez', property: 'Greenwood Apartments', amount: 1200, date: '2025-11-15', status: 'overdue' as const, type: 'rent' as const, unit: 'C-114' },
];

export const mockAnnouncements = [
  {
    id: '1',
    title: 'Diwali Festival Celebration',
    content: 'Join us for our annual Diwali celebration on October 24th in the community hall. Festival contribution: $25 per family.',
    date: '2025-10-10',
    isPinned: true,
    type: 'festival' as const
  },
  {
    id: '2',
    title: 'Water Supply Maintenance',
    content: 'Water supply will be temporarily shut off on January 15th from 9 AM to 2 PM for routine maintenance.',
    date: '2026-01-08',
    isPinned: true,
    type: 'alert' as const
  },
  {
    id: '3',
    title: 'New Parking Rules',
    content: 'Starting February 1st, all vehicles must display parking permits. Please collect yours from the office.',
    date: '2026-01-05',
    isPinned: false,
    type: 'announcement' as const
  },
];

export const mockChartData = {
  rentCollection: [
    { month: 'Aug', amount: 55200 },
    { month: 'Sep', amount: 58400 },
    { month: 'Oct', amount: 59800 },
    { month: 'Nov', amount: 57300 },
    { month: 'Dec', amount: 61500 },
    { month: 'Jan', amount: 58900 },
  ],
  paymentStatus: [
    { name: 'Paid', value: 75, fill: '#10b981' },
    { name: 'Pending', value: 18, fill: '#f59e0b' },
    { name: 'Overdue', value: 7, fill: '#ef4444' },
  ],
  maintenanceCategories: [
    { name: 'Plumbing', value: 6 },
    { name: 'Electrical', value: 4 },
    { name: 'HVAC', value: 3 },
    { name: 'Structural', value: 1 },
    { name: 'Cleaning', value: 2 },
  ]
};

export const mockNotifications = [
  {
    id: '1',
    title: 'Rent Due Reminder',
    message: 'Your rent of $1,200 is due on January 15, 2026',
    date: '2026-01-12',
    read: false,
    type: 'payment' as const
  },
  {
    id: '2',
    title: 'Maintenance Request Update',
    message: 'Your maintenance request for leaking faucet is now in progress',
    date: '2026-01-11',
    read: false,
    type: 'maintenance' as const
  },
  {
    id: '3',
    title: 'New Community Announcement',
    message: 'Water supply maintenance scheduled for January 15th',
    date: '2026-01-08',
    read: true,
    type: 'announcement' as const
  },
];

// Sample community messages for each property
export const mockCommunityMessages = {
  'Greenwood Apartments': [
    {
      id: 'msg-1',
      sender: 'John Anderson',
      senderRole: 'landlord' as const,
      content: 'Welcome to Greenwood Apartments Community! Feel free to share any announcements or concerns here.',
      timestamp: '2026-01-08T10:00:00',
      type: 'text' as const
    },
    {
      id: 'msg-2',
      sender: 'Sarah Miller',
      senderRole: 'tenant' as const,
      content: 'Thanks for setting this up! Very convenient to stay connected.',
      timestamp: '2026-01-08T10:30:00',
      type: 'text' as const
    },
    {
      id: 'msg-3',
      sender: 'James Wilson',
      senderRole: 'tenant' as const,
      content: 'Great initiative! Looking forward to community updates.',
      timestamp: '2026-01-08T11:00:00',
      type: 'text' as const
    },
    {
      id: 'msg-4',
      sender: 'John Anderson',
      senderRole: 'landlord' as const,
      content: 'Water supply maintenance scheduled for January 15th from 9 AM to 2 PM. Please plan accordingly and store water in advance.',
      timestamp: '2026-01-10T09:00:00',
      type: 'text' as const
    },
    {
      id: 'msg-5',
      sender: 'Robert Chen',
      senderRole: 'tenant' as const,
      content: 'Thank you for the heads up! Will make sure to fill containers.',
      timestamp: '2026-01-10T09:30:00',
      type: 'text' as const
    },
    {
      id: 'msg-6',
      sender: 'Lisa Thompson',
      senderRole: 'tenant' as const,
      content: 'Appreciate the advance notice 👍',
      timestamp: '2026-01-10T10:00:00',
      type: 'text' as const
    },
    {
      id: 'msg-7',
      sender: 'John Anderson',
      senderRole: 'landlord' as const,
      content: 'Reminder: Parking permits must be displayed starting February 1st. Please collect yours from the office during business hours (9 AM - 5 PM).',
      timestamp: '2026-01-11T14:00:00',
      type: 'text' as const
    },
    {
      id: 'msg-8',
      sender: 'David Martinez',
      senderRole: 'tenant' as const,
      content: 'Can we collect them on weekends?',
      timestamp: '2026-01-11T14:15:00',
      type: 'text' as const
    },
    {
      id: 'msg-9',
      sender: 'John Anderson',
      senderRole: 'landlord' as const,
      content: 'Yes, the office will be open Saturdays 10 AM - 2 PM for permit collection.',
      timestamp: '2026-01-11T14:30:00',
      type: 'text' as const
    },
    {
      id: 'msg-10',
      sender: 'Jennifer White',
      senderRole: 'tenant' as const,
      content: 'Perfect, thank you!',
      timestamp: '2026-01-11T14:45:00',
      type: 'text' as const
    }
  ],
  'Riverside Towers': [
    {
      id: 'msg-1',
      sender: 'John Anderson',
      senderRole: 'landlord' as const,
      content: 'Welcome to Riverside Towers Community! Feel free to share any announcements or concerns here.',
      timestamp: '2026-01-08T11:00:00',
      type: 'text' as const
    },
    {
      id: 'msg-2',
      sender: 'Emily Davis',
      senderRole: 'tenant' as const,
      content: 'Hello everyone! Happy to be part of this community.',
      timestamp: '2026-01-08T11:30:00',
      type: 'text' as const
    },
    {
      id: 'msg-3',
      sender: 'Michael Brown',
      senderRole: 'tenant' as const,
      content: 'Great to have a dedicated group for the building!',
      timestamp: '2026-01-08T12:00:00',
      type: 'text' as const
    },
    {
      id: 'msg-4',
      sender: 'John Anderson',
      senderRole: 'landlord' as const,
      content: 'The gym will be closed for equipment maintenance on January 17th. It will reopen on January 18th morning.',
      timestamp: '2026-01-09T15:00:00',
      type: 'text' as const
    },
    {
      id: 'msg-5',
      sender: 'Jessica Wilson',
      senderRole: 'tenant' as const,
      content: 'Thanks for letting us know!',
      timestamp: '2026-01-09T15:20:00',
      type: 'text' as const
    },
    {
      id: 'msg-6',
      sender: 'Andrew Davis',
      senderRole: 'tenant' as const,
      content: 'Will the pool area be affected?',
      timestamp: '2026-01-09T15:30:00',
      type: 'text' as const
    },
    {
      id: 'msg-7',
      sender: 'John Anderson',
      senderRole: 'landlord' as const,
      content: 'No, the pool and other amenities will remain open as usual.',
      timestamp: '2026-01-09T15:45:00',
      type: 'text' as const
    },
    {
      id: 'msg-8',
      sender: 'Rachel Green',
      senderRole: 'tenant' as const,
      content: 'Good to know, thanks!',
      timestamp: '2026-01-09T16:00:00',
      type: 'text' as const
    },
    {
      id: 'msg-9',
      sender: 'John Anderson',
      senderRole: 'landlord' as const,
      content: 'Reminder: Please do not leave personal items in the common hallways. Fire safety regulations require clear pathways at all times.',
      timestamp: '2026-01-12T10:00:00',
      type: 'text' as const
    },
    {
      id: 'msg-10',
      sender: 'Mark Johnson',
      senderRole: 'tenant' as const,
      content: 'Understood, will make sure nothing is left outside.',
      timestamp: '2026-01-12T10:15:00',
      type: 'text' as const
    }
  ],
  'Sunset Plaza': [
    {
      id: 'msg-1',
      sender: 'John Anderson',
      senderRole: 'landlord' as const,
      content: 'Welcome to Sunset Plaza Community! Feel free to share any announcements or concerns here.',
      timestamp: '2026-01-08T12:00:00',
      type: 'text' as const
    },
    {
      id: 'msg-2',
      sender: 'Patrick Murphy',
      senderRole: 'tenant' as const,
      content: 'Thank you! Glad to have this communication channel.',
      timestamp: '2026-01-08T12:30:00',
      type: 'text' as const
    },
    {
      id: 'msg-3',
      sender: 'Hannah Bell',
      senderRole: 'tenant' as const,
      content: 'This is very helpful, thanks for setting it up!',
      timestamp: '2026-01-08T13:00:00',
      type: 'text' as const
    },
    {
      id: 'msg-4',
      sender: 'John Anderson',
      senderRole: 'landlord' as const,
      content: 'The building exterior will be repainted starting January 20th. Some scaffolding will be placed around the building. Work hours: 8 AM - 5 PM on weekdays.',
      timestamp: '2026-01-10T14:00:00',
      type: 'text' as const
    },
    {
      id: 'msg-5',
      sender: 'Nathan Brooks',
      senderRole: 'tenant' as const,
      content: 'How long will the painting take?',
      timestamp: '2026-01-10T14:20:00',
      type: 'text' as const
    },
    {
      id: 'msg-6',
      sender: 'John Anderson',
      senderRole: 'landlord' as const,
      content: 'Approximately 2-3 weeks depending on weather conditions. We will keep you updated on progress.',
      timestamp: '2026-01-10T14:30:00',
      type: 'text' as const
    },
    {
      id: 'msg-7',
      sender: 'Zoe Sanders',
      senderRole: 'tenant' as const,
      content: 'Great! The building could use a fresh coat of paint 😊',
      timestamp: '2026-01-10T14:45:00',
      type: 'text' as const
    },
    {
      id: 'msg-8',
      sender: 'Christian Hughes',
      senderRole: 'tenant' as const,
      content: 'Will parking be affected during the painting?',
      timestamp: '2026-01-11T09:00:00',
      type: 'text' as const
    },
    {
      id: 'msg-9',
      sender: 'John Anderson',
      senderRole: 'landlord' as const,
      content: 'Some parking spots near the building may be temporarily blocked. Alternative spots will be available in the rear lot.',
      timestamp: '2026-01-11T09:15:00',
      type: 'text' as const
    },
    {
      id: 'msg-10',
      sender: 'Lily Price',
      senderRole: 'tenant' as const,
      content: 'Okay, thanks for the information!',
      timestamp: '2026-01-11T09:30:00',
      type: 'text' as const
    }
  ]
};
