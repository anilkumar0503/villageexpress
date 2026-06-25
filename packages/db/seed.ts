import { PrismaClient, Scope } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env from root directory
config({ path: resolve(__dirname, '../../.env') })

const prisma = new PrismaClient()

async function main() {
  //console.log('🌱 Seeding database...')

  // ─── Roles ──────────────────────────────────────────────────────────────────
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: {},
      create: { name: 'SUPER_ADMIN', description: 'Full system access', level: 100 },
    }),
    prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { name: 'ADMIN', description: 'Operations manager', level: 80 },
    }),
    prisma.role.upsert({
      where: { name: 'FRANCHISE_OWNER' },
      update: {},
      create: { name: 'FRANCHISE_OWNER', description: 'Regional franchise partner', level: 60 },
    }),
    prisma.role.upsert({
      where: { name: 'POINT_MANAGER' },
      update: {},
      create: { name: 'POINT_MANAGER', description: 'Local branch manager', level: 40 },
    }),
    prisma.role.upsert({
      where: { name: 'CAPTAIN' },
      update: {},
      create: { name: 'CAPTAIN', description: 'Delivery rider', level: 20 },
    }),
    prisma.role.upsert({
      where: { name: 'CUSTOMER' },
      update: {},
      create: { name: 'CUSTOMER', description: 'End user / sender', level: 10 },
    }),
  ])

  const [superAdminRole, adminRole, , pointManagerRole, captainRole, customerRole] = roles
  //console.log(`✅ ${roles.length} roles seeded`)

  // ─── Permissions ────────────────────────────────────────────────────────────
  const permissionDefs = [
    { name: 'user:create', resource: 'user', action: 'create' },
    { name: 'user:read', resource: 'user', action: 'read' },
    { name: 'user:update', resource: 'user', action: 'update' },
    { name: 'user:delete', resource: 'user', action: 'delete' },
    { name: 'user:approve', resource: 'user', action: 'approve' },
    { name: 'role:manage', resource: 'role', action: 'manage' },
    { name: 'permission:manage', resource: 'permission', action: 'manage' },
    { name: 'location:create', resource: 'location', action: 'create' },
    { name: 'location:read', resource: 'location', action: 'read' },
    { name: 'location:update', resource: 'location', action: 'update' },
    { name: 'location:delete', resource: 'location', action: 'delete' },
    { name: 'booking:create', resource: 'booking', action: 'create' },
    { name: 'booking:read', resource: 'booking', action: 'read' },
    { name: 'booking:update', resource: 'booking', action: 'update' },
    { name: 'booking:delete', resource: 'booking', action: 'delete' },
    { name: 'booking:assign_captain', resource: 'booking', action: 'assign_captain' },
    { name: 'booking:update_status', resource: 'booking', action: 'update_status' },
    { name: 'pricing:manage', resource: 'pricing', action: 'manage' },
    { name: 'pricing:read', resource: 'pricing', action: 'read' },
    { name: 'payment:read', resource: 'payment', action: 'read' },
    { name: 'payment:refund', resource: 'payment', action: 'refund' },
    { name: 'profile:edit', resource: 'profile', action: 'edit' },
    { name: 'audit:read', resource: 'audit', action: 'read' },
    { name: 'report:read', resource: 'report', action: 'read' },
    { name: 'commission:view', resource: 'commission', action: 'view' },
    { name: 'commission:approve', resource: 'commission', action: 'approve' },
    { name: 'commission:process_payout', resource: 'commission', action: 'process_payout' },
    { name: 'coupon:write', resource: 'coupon', action: 'write' },
    { name: 'coupon:read', resource: 'coupon', action: 'read' },
    { name: 'settings:manage', resource: 'settings', action: 'manage' },
  ]

  const permissions = await Promise.all(
    permissionDefs.map((p) =>
      prisma.permission.upsert({
        where: { name: p.name },
        update: {},
        create: p,
      }),
    ),
  )
  //console.log(`✅ ${permissions.length} permissions seeded`)

  const perm = Object.fromEntries(permissions.map((p) => [p.name, p.id]))

  // ─── Role → Permission mappings ─────────────────────────────────────────────
  const rolePerm = (roleId: string, permName: string, scope: Scope = Scope.GLOBAL) => ({
    roleId,
    permissionId: perm[permName],
    scope,
  })

  // SUPER_ADMIN — all permissions, global scope
  const superAdminPerms = permissionDefs.map((p) => rolePerm(superAdminRole.id, p.name))

  // ADMIN — all except role/permission management
  const adminPerms = [
    rolePerm(adminRole.id, 'user:create'),
    rolePerm(adminRole.id, 'user:read'),
    rolePerm(adminRole.id, 'user:update'),
    rolePerm(adminRole.id, 'user:approve'),
    rolePerm(adminRole.id, 'location:create'),
    rolePerm(adminRole.id, 'location:read'),
    rolePerm(adminRole.id, 'location:update'),
    rolePerm(adminRole.id, 'location:delete'),
    rolePerm(adminRole.id, 'booking:read'),
    rolePerm(adminRole.id, 'booking:update'),
    rolePerm(adminRole.id, 'booking:assign_captain'),
    rolePerm(adminRole.id, 'booking:update_status'),
    rolePerm(adminRole.id, 'pricing:manage'),
    rolePerm(adminRole.id, 'pricing:read'),
    rolePerm(adminRole.id, 'payment:read'),
    rolePerm(adminRole.id, 'payment:refund'),
    rolePerm(adminRole.id, 'profile:edit'),
    rolePerm(adminRole.id, 'audit:read'),
    rolePerm(adminRole.id, 'report:read'),
    rolePerm(adminRole.id, 'coupon:write'),
    rolePerm(adminRole.id, 'coupon:read'),
    rolePerm(adminRole.id, 'settings:manage'),
  ]

  // POINT_MANAGER — location-scoped
  const pmPerms = [
    rolePerm(pointManagerRole.id, 'booking:read', Scope.LOCATION),
    rolePerm(pointManagerRole.id, 'booking:assign_captain', Scope.LOCATION),
    rolePerm(pointManagerRole.id, 'booking:update_status', Scope.LOCATION),
    rolePerm(pointManagerRole.id, 'location:read'),
    rolePerm(pointManagerRole.id, 'profile:edit'),
    rolePerm(pointManagerRole.id, 'report:read', Scope.LOCATION),
  ]

  // CAPTAIN — own bookings only
  const captainPerms = [
    rolePerm(captainRole.id, 'booking:read', Scope.LOCATION),
    rolePerm(captainRole.id, 'booking:update_status', Scope.LOCATION),
    rolePerm(captainRole.id, 'profile:edit'),
  ]

  // CUSTOMER — own data only
  const customerPerms = [
    rolePerm(customerRole.id, 'booking:create'),
    rolePerm(customerRole.id, 'booking:read', Scope.LOCATION),
    rolePerm(customerRole.id, 'profile:edit'),
    rolePerm(customerRole.id, 'payment:read'),
  ]

  const allRolePerms = [
    ...superAdminPerms,
    ...adminPerms,
    ...pmPerms,
    ...captainPerms,
    ...customerPerms,
  ]

  for (const rp of allRolePerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId_scope: rp },
      update: {},
      create: rp,
    })
  }
  //console.log(`✅ Role-permission mappings seeded`)

  // ─── Super Admin user ────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('VE@2026', 12)

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@villageexpress.in' },
    update: {},
    create: {
      displayId: 'VE-SA-0001',
      name: 'Super Admin',
      email: 'admin@villageexpress.in',
      phone: '0000000000',
      password: hashedPassword,
      approvalStatus: 'APPROVED',
      isActive: true,
    },
  })

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: superAdmin.id, roleId: superAdminRole.id } },
    update: {},
    create: {
      userId: superAdmin.id,
      roleId: superAdminRole.id,
      isPrimary: true,
    },
  })

  //console.log(`✅ Super Admin seeded: admin@villageexpress.in`)
  //console.log(`⚠️  Change the Super Admin password immediately after first login!`)

  // ─── Clean up old sample data ─────────────────────────────────────────────────────
  await prisma.booking.deleteMany({})
  await prisma.route.deleteMany({})
  await prisma.pricingRule.deleteMany({
    where: {
      sourceLocationId: {
        in: ['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003'],
      },
    },
  })
  await prisma.pricingRule.deleteMany({
    where: { sourceLocationId: null, destinationLocationId: null },
  })
  await prisma.user.deleteMany({
    where: {
      email: {
        in: ['admin2@villageexpress.in', 'pm@villageexpress.in', 'captain@villageexpress.in', 'customer@villageexpress.in'],
      },
    },
  })
  await prisma.location.deleteMany({
    where: {
      id: {
        in: ['loc-1', 'loc-2', 'loc-3', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003'],
      },
    },
  })

  // ─── Sample Locations ─────────────────────────────────────────────────────────────
  const locations = await Promise.all([
    prisma.location.create({
      data: {
        id: '00000000-0000-0000-0000-000000000001',
        state: 'Telangana',
        district: 'Karimnagar',
        mandal: 'Choppadandi',
        village: 'Choppadandi',
        pointName: 'Choppadandi Express Center',
        pincode: '505201',
        latitude: 18.5,
        longitude: 79.0,
        locationType: 'POINT',
        isActive: true,
      },
    }),
    prisma.location.create({
      data: {
        id: '00000000-0000-0000-0000-000000000002',
        state: 'Telangana',
        district: 'Karimnagar',
        mandal: 'Karimnagar',
        village: 'Karimnagar',
        pointName: 'Karimnagar Main Hub',
        pincode: '505001',
        latitude: 18.43,
        longitude: 79.12,
        locationType: 'HUB',
        isActive: true,
      },
    }),
    prisma.location.create({
      data: {
        id: '00000000-0000-0000-0000-000000000003',
        state: 'Telangana',
        district: 'Warangal',
        mandal: 'Hanumakonda',
        village: 'Hanumakonda',
        pointName: 'Hanumakonda Express Center',
        pincode: '506001',
        latitude: 18.0,
        longitude: 79.57,
        locationType: 'POINT',
        isActive: true,
      },
    }),
  ])
  //console.log(`✅ ${locations.length} sample locations seeded`)

  // ─── Sample Users ────────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123', 12)
  const pmPassword = await bcrypt.hash('Pm@123', 12)
  const captainPassword = await bcrypt.hash('Captain@123', 12)
  const customerPassword = await bcrypt.hash('Customer@123', 12)

  const [adminUser, pmUser, captainUser, customerUser] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin2@villageexpress.in' },
      update: {},
      create: {
        displayId: 'VE-AD-0001',
        name: 'Test Admin',
        email: 'admin2@villageexpress.in',
        phone: '9999999991',
        password: adminPassword,
        approvalStatus: 'APPROVED',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'pm@villageexpress.in' },
      update: {},
      create: {
        displayId: 'VE-PM-0001',
        name: 'Test Point Manager',
        email: 'pm@villageexpress.in',
        phone: '9999999992',
        password: pmPassword,
        approvalStatus: 'APPROVED',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'captain@villageexpress.in' },
      update: {},
      create: {
        displayId: 'VE-CP-0001',
        name: 'Test Captain',
        email: 'captain@villageexpress.in',
        phone: '9999999993',
        password: captainPassword,
        approvalStatus: 'APPROVED',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'customer@villageexpress.in' },
      update: {},
      create: {
        displayId: 'VE-CU-0001',
        name: 'Test Customer',
        email: 'customer@villageexpress.in',
        phone: '9999999994',
        password: customerPassword,
        approvalStatus: 'APPROVED',
        isActive: true,
      },
    }),
  ])

  // Assign roles to sample users
  await Promise.all([
    prisma.userRole.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
      update: {},
      create: { userId: adminUser.id, roleId: adminRole.id, isPrimary: true },
    }),
    prisma.userRole.upsert({
      where: { userId_roleId: { userId: pmUser.id, roleId: pointManagerRole.id } },
      update: {},
      create: { userId: pmUser.id, roleId: pointManagerRole.id, isPrimary: true },
    }),
    prisma.userRole.upsert({
      where: { userId_roleId: { userId: captainUser.id, roleId: captainRole.id } },
      update: {},
      create: { userId: captainUser.id, roleId: captainRole.id, isPrimary: true },
    }),
    prisma.userRole.upsert({
      where: { userId_roleId: { userId: customerUser.id, roleId: customerRole.id } },
      update: {},
      create: { userId: customerUser.id, roleId: customerRole.id, isPrimary: true },
    }).catch(() => {
      // Ignore if already exists
    }),
  ])

  // Create PM profile
  await prisma.pointManagerProfile.upsert({
    where: { userId: pmUser.id },
    update: {},
    create: {
      userId: pmUser.id,
      shopName: 'Choppadandi Express Branch',
      shopLocationId: '00000000-0000-0000-0000-000000000001',
    },
  })

  // Create Captain profile
  await prisma.captainProfile.upsert({
    where: { userId: captainUser.id },
    update: {},
    create: {
      userId: captainUser.id,
      aadhaarNumber: '123456789012',
      aadhaarPhoto: 'https://example.com/aadhaar.jpg',
      drivingLicense: 'TS1234567890123',
      licensePhoto: 'https://example.com/license.jpg',
      vehicleType: 'BIKE',
      vehicleNumber: 'TS12AB1234',
      districtId: '00000000-0000-0000-0000-000000000001',
      availabilityStatus: 'AVAILABLE',
    },
  })

  //console.log(`✅ Sample users seeded`)

  // ─── Sample Bookings ─────────────────────────────────────────────────────────────
  const sampleBooking = await prisma.booking.upsert({
    where: { bookingNumber: 'VE-2026-0001' },
    update: {},
    create: {
      bookingNumber: 'VE-2026-0001',
      customerId: customerUser.id,
      pickupLocationId: '00000000-0000-0000-0000-000000000001',
      dropLocationId: '00000000-0000-0000-0000-000000000003',
      assignedPointManagerId: pmUser.id,
      parcelWeight: 2.5,
      parcelType: 'GENERAL',
      deliveryPriority: 'STANDARD',
      calculatedPrice: 150,
      estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      status: 'CONFIRMED',
    },
  })
  //console.log(`✅ Sample booking seeded`)

  // ─── Sample Pricing Rules ─────────────────────────────────────────────────────────
  await prisma.pricingRule.create({
    data: {
      sourceLocationId: '00000000-0000-0000-0000-000000000001',
      destinationLocationId: '00000000-0000-0000-0000-000000000002',
      minWeight: 0.1,
      maxWeight: 50,
      basePrice: 50,
      pricePerKm: 2,
      estimatedDeliveryDays: 1,
    },
  })
  await prisma.pricingRule.create({
    data: {
      sourceLocationId: '00000000-0000-0000-0000-000000000001',
      destinationLocationId: '00000000-0000-0000-0000-000000000003',
      minWeight: 0.1,
      maxWeight: 50,
      basePrice: 100,
      pricePerKm: 3,
      estimatedDeliveryDays: 2,
    },
  })
  await prisma.pricingRule.create({
    data: {
      sourceLocationId: '00000000-0000-0000-0000-000000000002',
      destinationLocationId: '00000000-0000-0000-0000-000000000003',
      minWeight: 0.1,
      maxWeight: 50,
      basePrice: 80,
      pricePerKm: 2.5,
      estimatedDeliveryDays: 2,
    },
  })
  // Default fallback rule (no specific locations)
  await prisma.pricingRule.create({
    data: {
      sourceLocationId: null,
      destinationLocationId: null,
      minWeight: 0.1,
      maxWeight: 100,
      basePrice: 50,
      pricePerKm: 2,
      estimatedDeliveryDays: 3,
    },
  })
  //console.log(`✅ Sample pricing rules seeded`)

  // ─── Jagitial to Karimnagar Multi-Segment Route Seeder ───────────────────────────────
  //console.log('🛣️  Seeding Jagitial to Karimnagar route...')

  // Clean up existing route data
  await prisma.route.deleteMany({ where: { name: 'Jagitial to Karimnagar' } })
  await prisma.pointManagerProfile.deleteMany({
    where: {
      shopName: {
        in: ['Jagitial Branch', 'Malial Branch', 'Poodoor Branch', 'Gangadhara Branch', 'Karimnagar Branch'],
      },
    },
  })
  await prisma.location.deleteMany({
    where: {
      village: {
        in: ['Jagitial', 'Malial', 'Poodoor', 'Gangadhara', 'Karimnagar City'],
      },
    },
  })

  // Create locations for the route
  const [jagitialLoc, malialLoc, poodoorLoc, gangadharaLoc, karimnagarLoc] = await Promise.all([
    prisma.location.create({
      data: {
        state: 'Telangana',
        district: 'Jagitial',
        mandal: 'Jagitial',
        village: 'Jagitial',
        pointName: 'Jagitial Express Center',
        pincode: '505327',
        latitude: 18.79,
        longitude: 79.47,
        locationType: 'POINT',
        isActive: true,
      },
    }),
    prisma.location.create({
      data: {
        state: 'Telangana',
        district: 'Jagitial',
        mandal: 'Jagitial',
        village: 'Malial',
        pointName: 'Malial Express Center',
        pincode: '505328',
        latitude: 18.82,
        longitude: 79.52,
        locationType: 'POINT',
        isActive: true,
      },
    }),
    prisma.location.create({
      data: {
        state: 'Telangana',
        district: 'Karimnagar',
        mandal: 'Karimnagar Rural',
        village: 'Poodoor',
        pointName: 'Poodoor Express Center',
        pincode: '505451',
        latitude: 18.68,
        longitude: 79.08,
        locationType: 'POINT',
        isActive: true,
      },
    }),
    prisma.location.create({
      data: {
        state: 'Telangana',
        district: 'Karimnagar',
        mandal: 'Karimnagar Rural',
        village: 'Gangadhara',
        pointName: 'Gangadhara Express Center',
        pincode: '505452',
        latitude: 18.62,
        longitude: 79.02,
        locationType: 'POINT',
        isActive: true,
      },
    }),
    prisma.location.create({
      data: {
        state: 'Telangana',
        district: 'Karimnagar',
        mandal: 'Karimnagar',
        village: 'Karimnagar City',
        pointName: 'Karimnagar City Hub',
        pincode: '505001',
        latitude: 18.43,
        longitude: 79.12,
        locationType: 'HUB',
        isActive: true,
      },
    }),
  ])
  //console.log(`✅ 5 route locations created`)

  // Create point managers for each location
  const routePmPassword = await bcrypt.hash('Pm@123', 12)
  const [jagitialPM, malialPM, poodoorPM, gangadharaPM, karimnagarPM] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'pm.jagitial@villageexpress.in' },
      update: {},
      create: {
        displayId: 'VE-PM-JAG',
        name: 'Jagitial Point Manager',
        email: 'pm.jagitial@villageexpress.in',
        phone: '9988776601',
        password: routePmPassword,
        approvalStatus: 'APPROVED',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'pm.malial@villageexpress.in' },
      update: {},
      create: {
        displayId: 'VE-PM-MAL',
        name: 'Malial Point Manager',
        email: 'pm.malial@villageexpress.in',
        phone: '9988776602',
        password: routePmPassword,
        approvalStatus: 'APPROVED',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'pm.poodoor@villageexpress.in' },
      update: {},
      create: {
        displayId: 'VE-PM-POO',
        name: 'Poodoor Point Manager',
        email: 'pm.poodoor@villageexpress.in',
        phone: '9988776603',
        password: routePmPassword,
        approvalStatus: 'APPROVED',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'pm.gangadhara@villageexpress.in' },
      update: {},
      create: {
        displayId: 'VE-PM-GAN',
        name: 'Gangadhara Point Manager',
        email: 'pm.gangadhara@villageexpress.in',
        phone: '9988776604',
        password: routePmPassword,
        approvalStatus: 'APPROVED',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'pm.karimnagar@villageexpress.in' },
      update: {},
      create: {
        displayId: 'VE-PM-KAR',
        name: 'Karimnagar Point Manager',
        email: 'pm.karimnagar@villageexpress.in',
        phone: '9988776605',
        password: routePmPassword,
        approvalStatus: 'APPROVED',
        isActive: true,
      },
    }),
  ])

  // Assign PM roles and create profiles
  await Promise.all([
    prisma.userRole.upsert({
      where: { userId_roleId: { userId: jagitialPM.id, roleId: pointManagerRole.id } },
      update: {},
      create: { userId: jagitialPM.id, roleId: pointManagerRole.id, isPrimary: true },
    }),
    prisma.userRole.upsert({
      where: { userId_roleId: { userId: malialPM.id, roleId: pointManagerRole.id } },
      update: {},
      create: { userId: malialPM.id, roleId: pointManagerRole.id, isPrimary: true },
    }),
    prisma.userRole.upsert({
      where: { userId_roleId: { userId: poodoorPM.id, roleId: pointManagerRole.id } },
      update: {},
      create: { userId: poodoorPM.id, roleId: pointManagerRole.id, isPrimary: true },
    }),
    prisma.userRole.upsert({
      where: { userId_roleId: { userId: gangadharaPM.id, roleId: pointManagerRole.id } },
      update: {},
      create: { userId: gangadharaPM.id, roleId: pointManagerRole.id, isPrimary: true },
    }),
    prisma.userRole.upsert({
      where: { userId_roleId: { userId: karimnagarPM.id, roleId: pointManagerRole.id } },
      update: {},
      create: { userId: karimnagarPM.id, roleId: pointManagerRole.id, isPrimary: true },
    }),
    prisma.pointManagerProfile.upsert({
      where: { userId: jagitialPM.id },
      update: {},
      create: { userId: jagitialPM.id, shopName: 'Jagitial Branch', shopLocationId: jagitialLoc.id },
    }),
    prisma.pointManagerProfile.upsert({
      where: { userId: malialPM.id },
      update: {},
      create: { userId: malialPM.id, shopName: 'Malial Branch', shopLocationId: malialLoc.id },
    }),
    prisma.pointManagerProfile.upsert({
      where: { userId: poodoorPM.id },
      update: {},
      create: { userId: poodoorPM.id, shopName: 'Poodoor Branch', shopLocationId: poodoorLoc.id },
    }),
    prisma.pointManagerProfile.upsert({
      where: { userId: gangadharaPM.id },
      update: {},
      create: { userId: gangadharaPM.id, shopName: 'Gangadhara Branch', shopLocationId: gangadharaLoc.id },
    }),
    prisma.pointManagerProfile.upsert({
      where: { userId: karimnagarPM.id },
      update: {},
      create: { userId: karimnagarPM.id, shopName: 'Karimnagar Branch', shopLocationId: karimnagarLoc.id },
    }),
  ])
  //console.log(`✅ 5 point managers created`)

  // Create captains for each segment
  const routeCaptainPassword = await bcrypt.hash('Captain@123', 12)
  const [captain1, captain2, captain3, captain4] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'captain1@villageexpress.in' },
      update: {},
      create: {
        displayId: 'VE-CP-SEG1',
        name: 'Captain Segment 1',
        email: 'captain1@villageexpress.in',
        phone: '9988776651',
        password: routeCaptainPassword,
        approvalStatus: 'APPROVED',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'captain2@villageexpress.in' },
      update: {},
      create: {
        displayId: 'VE-CP-SEG2',
        name: 'Captain Segment 2',
        email: 'captain2@villageexpress.in',
        phone: '9988776652',
        password: routeCaptainPassword,
        approvalStatus: 'APPROVED',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'captain3@villageexpress.in' },
      update: {},
      create: {
        displayId: 'VE-CP-SEG3',
        name: 'Captain Segment 3',
        email: 'captain3@villageexpress.in',
        phone: '9988776653',
        password: routeCaptainPassword,
        approvalStatus: 'APPROVED',
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'captain4@villageexpress.in' },
      update: {},
      create: {
        displayId: 'VE-CP-SEG4',
        name: 'Captain Segment 4',
        email: 'captain4@villageexpress.in',
        phone: '9988776654',
        password: routeCaptainPassword,
        approvalStatus: 'APPROVED',
        isActive: true,
      },
    }),
  ])

  // Assign captain roles and create profiles
  await Promise.all([
    prisma.userRole.upsert({
      where: { userId_roleId: { userId: captain1.id, roleId: captainRole.id } },
      update: {},
      create: { userId: captain1.id, roleId: captainRole.id, isPrimary: true },
    }),
    prisma.userRole.upsert({
      where: { userId_roleId: { userId: captain2.id, roleId: captainRole.id } },
      update: {},
      create: { userId: captain2.id, roleId: captainRole.id, isPrimary: true },
    }),
    prisma.userRole.upsert({
      where: { userId_roleId: { userId: captain3.id, roleId: captainRole.id } },
      update: {},
      create: { userId: captain3.id, roleId: captainRole.id, isPrimary: true },
    }),
    prisma.userRole.upsert({
      where: { userId_roleId: { userId: captain4.id, roleId: captainRole.id } },
      update: {},
      create: { userId: captain4.id, roleId: captainRole.id, isPrimary: true },
    }),
    prisma.captainProfile.upsert({
      where: { userId: captain1.id },
      update: {},
      create: {
        userId: captain1.id,
        aadhaarNumber: '111111111112',
        drivingLicense: 'TS1111111111123',
        vehicleType: 'BIKE',
        vehicleNumber: 'TS11AB1111',
        districtId: jagitialLoc.id,
        availabilityStatus: 'AVAILABLE',
      },
    }),
    prisma.captainProfile.upsert({
      where: { userId: captain2.id },
      update: {},
      create: {
        userId: captain2.id,
        aadhaarNumber: '222222222212',
        drivingLicense: 'TS2222222222123',
        vehicleType: 'BIKE',
        vehicleNumber: 'TS22AB2222',
        districtId: malialLoc.id,
        availabilityStatus: 'AVAILABLE',
      },
    }),
    prisma.captainProfile.upsert({
      where: { userId: captain3.id },
      update: {},
      create: {
        userId: captain3.id,
        aadhaarNumber: '333333333312',
        drivingLicense: 'TS3333333333123',
        vehicleType: 'BIKE',
        vehicleNumber: 'TS33AB3333',
        districtId: poodoorLoc.id,
        availabilityStatus: 'AVAILABLE',
      },
    }),
    prisma.captainProfile.upsert({
      where: { userId: captain4.id },
      update: {},
      create: {
        userId: captain4.id,
        aadhaarNumber: '444444444412',
        drivingLicense: 'TS4444444444123',
        vehicleType: 'BIKE',
        vehicleNumber: 'TS44AB4444',
        districtId: gangadharaLoc.id,
        availabilityStatus: 'AVAILABLE',
      },
    }),
  ])
  //console.log(`✅ 4 captains created`)

  // Create the route with segments
  const route = await prisma.route.create({
    data: {
      name: 'Jagitial to Karimnagar',
      sourceLocationId: jagitialLoc.id,
      destinationLocationId: karimnagarLoc.id,
      estimatedDays: 2,
      isActive: true,
      segments: {
        create: [
          {
            sequenceOrder: 1,
            fromLocationId: jagitialLoc.id,
            toLocationId: malialLoc.id,
            distanceKm: 15,
            estimatedHours: 1,
          },
          {
            sequenceOrder: 2,
            fromLocationId: malialLoc.id,
            toLocationId: poodoorLoc.id,
            distanceKm: 20,
            estimatedHours: 1.5,
          },
          {
            sequenceOrder: 3,
            fromLocationId: poodoorLoc.id,
            toLocationId: gangadharaLoc.id,
            distanceKm: 18,
            estimatedHours: 1.5,
          },
          {
            sequenceOrder: 4,
            fromLocationId: gangadharaLoc.id,
            toLocationId: karimnagarLoc.id,
            distanceKm: 25,
            estimatedHours: 2,
          },
        ],
      },
      pricingRules: {
        create: [
          {
            minWeight: 0.1,
            maxWeight: 5,
            basePrice: 100,
            pricePerKm: 3,
            priority: 'STANDARD',
            isActive: true,
          },
          {
            minWeight: 5.1,
            maxWeight: 20,
            basePrice: 150,
            pricePerKm: 4,
            priority: 'STANDARD',
            isActive: true,
          },
          {
            minWeight: 0.1,
            maxWeight: 5,
            basePrice: 150,
            pricePerKm: 5,
            priority: 'EXPRESS',
            isActive: true,
          },
        ],
      },
    },
    include: {
      segments: true,
      pricingRules: true,
    },
  })
  //console.log(`✅ Route created: ${route.name} with ${route.segments.length} segments`)

  // Create test customer
  const testCustomer = await prisma.user.upsert({
    where: { email: 'test.route@villageexpress.in' },
    update: {},
    create: {
      displayId: 'VE-CU-ROUTE',
      name: 'Route Test Customer',
      email: 'test.route@villageexpress.in',
      phone: '9988776699',
      password: await bcrypt.hash('Customer@123', 12),
      approvalStatus: 'APPROVED',
      isActive: true,
    },
  })
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: testCustomer.id, roleId: customerRole.id } },
    update: {},
    create: { userId: testCustomer.id, roleId: customerRole.id, isPrimary: true },
  })
  //console.log(`✅ Test customer created: ${testCustomer.email}`)

  // Create test booking with route
  const testBooking = await prisma.booking.create({
    data: {
      bookingNumber: 'VE-ROUTE-TEST-001',
      customerId: testCustomer.id,
      pickupLocationId: jagitialLoc.id,
      dropLocationId: karimnagarLoc.id,
      routeId: route.id,
      parcelWeight: 3.5,
      parcelType: 'GENERAL',
      deliveryPriority: 'STANDARD',
      calculatedPrice: 100 + (78 * 3), // base 100 + 78km * 3
      estimatedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      status: 'CONFIRMED',
      segments: {
        create: [
          {
            routeSegmentId: route.segments[0].id,
            sequenceOrder: 1,
            status: 'PENDING',
            assignedPointManagerId: jagitialPM.id,
          },
          {
            routeSegmentId: route.segments[1].id,
            sequenceOrder: 2,
            status: 'PENDING',
            assignedPointManagerId: malialPM.id,
          },
          {
            routeSegmentId: route.segments[2].id,
            sequenceOrder: 3,
            status: 'PENDING',
            assignedPointManagerId: poodoorPM.id,
          },
          {
            routeSegmentId: route.segments[3].id,
            sequenceOrder: 4,
            status: 'PENDING',
            assignedPointManagerId: gangadharaPM.id,
          },
        ],
      },
    },
    include: {
      segments: {
        include: {
          routeSegment: {
            include: {
              fromLocation: true,
              toLocation: true,
            },
          },
          pointManager: true,
        },
      },
    },
  })
  //console.log(`✅ Test booking created: ${testBooking.bookingNumber}`)
  //console.log(`   Route: Jagitial → Malial → Poodoor → Gangadhara → Karimnagar`)
  //console.log(`   Total Distance: 78km`)
  //console.log(`   Price: ₹${testBooking.calculatedPrice}`)
  //console.log(`   Segments: ${testBooking.segments.length}`)

  // ─── Support System Seeders ─────────────────────────────────────────────────────
  //console.log('🎫 Seeding support system data...')

  // Canned Responses
  const cannedResponses = await Promise.all([
    prisma.cannedResponse.create({
      data: {
        title: 'Delivery Delay Response',
        category: 'BOOKING',
        content: 'We apologize for the delay in your delivery. Our team is actively tracking your parcel and will ensure it reaches you as soon as possible. You can track your package using the booking number.',
        isActive: true,
      },
    }),
    prisma.cannedResponse.create({
      data: {
        title: 'Payment Failed Response',
        category: 'PAYMENT',
        content: 'We understand your payment failed. Please check your payment method and try again. If the issue persists, please contact your bank or use an alternative payment method.',
        isActive: true,
      },
    }),
    prisma.cannedResponse.create({
      data: {
        title: 'KYC Verification Response',
        category: 'ONBOARDING',
        content: 'Your KYC documents are under review. This process typically takes 1-2 business days. We will notify you once verification is complete.',
        isActive: true,
      },
    }),
    prisma.cannedResponse.create({
      data: {
        title: 'General Greeting',
        category: 'GENERAL',
        content: 'Thank you for contacting Village Express Support. How can we assist you today?',
        isActive: true,
      },
    }),
  ])
  //console.log(`✅ ${cannedResponses.length} canned responses seeded`)

  // Support Tickets for different users
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

  const [customerTicket, captainTicket, pmTicket] = await Promise.all([
    prisma.supportTicket.create({
      data: {
        ticketNumber: 'VE-SUP-20260101-0001',
        userId: customerUser.id,
        subject: 'Package not delivered on time',
        category: 'BOOKING',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        bookingId: sampleBooking.id,
        issueType: 'DELAY',
        assignedTo: adminUser.id,
        slaDueDate: new Date(now.getTime() + 8 * 60 * 60 * 1000),
        firstResponseAt: yesterday,
        messages: {
          create: [
            {
              senderId: customerUser.id,
              isAdmin: false,
              content: 'My package was supposed to be delivered yesterday but I still haven\'t received it. Please check the status.',
              createdAt: twoDaysAgo,
            },
            {
              senderId: adminUser.id,
              isAdmin: true,
              content: 'We apologize for the delay. Our team is investigating the issue and will update you shortly.',
              createdAt: yesterday,
            },
          ],
        },
      },
    }),
    prisma.supportTicket.create({
      data: {
        ticketNumber: 'VE-SUP-20260101-0002',
        userId: captainUser.id,
        subject: 'App not showing my assigned deliveries',
        category: 'TECHNICAL',
        priority: 'MEDIUM',
        status: 'RESOLVED',
        captainProfileId: (await prisma.captainProfile.findUnique({ where: { userId: captainUser.id } }))?.id,
        issueType: 'APP_CRASH',
        resolvedBy: adminUser.id,
        resolvedAt: yesterday,
        satisfactionRating: 5,
        satisfactionComment: 'Quick and helpful response!',
        messages: {
          create: [
            {
              senderId: captainUser.id,
              isAdmin: false,
              content: 'The captain app is not showing my assigned deliveries for today.',
              createdAt: twoDaysAgo,
            },
            {
              senderId: adminUser.id,
              isAdmin: true,
              content: 'Please try refreshing the app. If the issue persists, clear your app cache and restart.',
              createdAt: twoDaysAgo,
            },
            {
              senderId: captainUser.id,
              isAdmin: false,
              content: 'That worked, thank you!',
              createdAt: yesterday,
            },
          ],
        },
      },
    }),
    prisma.supportTicket.create({
      data: {
        ticketNumber: 'VE-SUP-20260101-0003',
        userId: pmUser.id,
        subject: 'Commission payout not received',
        category: 'PAYMENT',
        priority: 'HIGH',
        status: 'OPEN',
        issueType: 'PAYOUT_DELAY',
        slaDueDate: new Date(now.getTime() + 8 * 60 * 60 * 1000),
        messages: {
          create: [
            {
              senderId: pmUser.id,
              isAdmin: false,
              content: 'I haven\'t received my commission payout for last week. Please check.',
              createdAt: now,
            },
          ],
        },
      },
    }),
  ])
  //console.log(`✅ 3 support tickets seeded`)

  // Captain Point Assignments
  const captainProfile1 = await prisma.captainProfile.findUnique({ where: { userId: captain1.id } })
  const captainProfile2 = await prisma.captainProfile.findUnique({ where: { userId: captain2.id } })
  const captainProfile3 = await prisma.captainProfile.findUnique({ where: { userId: captain3.id } })
  const captainProfile4 = await prisma.captainProfile.findUnique({ where: { userId: captain4.id } })

  await Promise.all([
    prisma.captainPointAssignment.create({
      data: {
        captainId: captainProfile1!.id,
        locationId: jagitialLoc.id,
        isActive: true,
      },
    }),
    prisma.captainPointAssignment.create({
      data: {
        captainId: captainProfile2!.id,
        locationId: malialLoc.id,
        isActive: true,
      },
    }),
    prisma.captainPointAssignment.create({
      data: {
        captainId: captainProfile3!.id,
        locationId: poodoorLoc.id,
        isActive: true,
      },
    }),
    prisma.captainPointAssignment.create({
      data: {
        captainId: captainProfile4!.id,
        locationId: gangadharaLoc.id,
        isActive: true,
      },
    }),
  ])
  //console.log(`✅ 4 captain point assignments seeded`)

  // Sample Coupon
  await prisma.coupon.upsert({
    where: { code: 'WELCOME20' },
    update: {},
    create: {
      code: 'WELCOME20',
      type: 'PERCENTAGE',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minOrderValue: 100,
      maxDiscountAmount: 100,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usageLimit: 1000,
      usageCount: 0,
      isActive: true,
      applicableUsers: [],
      applicableRoutes: [],
    },
  })
  //console.log(`✅ Sample coupon seeded`)

  // Sample Wallet Transaction (instead of Payment)
  const customerWallet = await prisma.wallet.upsert({
    where: { userId: customerUser.id },
    update: {},
    create: {
      userId: customerUser.id,
      balance: 0,
    },
  })
  await prisma.walletTransaction.create({
    data: {
      walletId: customerWallet.id,
      userId: customerUser.id,
      type: 'BOOKING_PAYMENT',
      amount: 150,
      balanceBefore: 150,
      balanceAfter: 0,
      description: 'Payment for booking ' + sampleBooking.bookingNumber,
      referenceId: sampleBooking.id,
      referenceType: 'BOOKING',
    },
  })
  //console.log(`✅ Sample wallet transaction seeded`)

  // Create wallet for captain first
  const captainWallet = await prisma.wallet.upsert({
    where: { userId: captain1.id },
    update: {},
    create: {
      userId: captain1.id,
      balance: 10000,
    },
  })

  // Sample Withdrawal Request (instead of Payout)
  await prisma.withdrawalRequest.upsert({
    where: { id: 'seed-withdrawal-001' },
    update: {},
    create: {
      id: 'seed-withdrawal-001',
      userId: captain1.id,
      walletId: captainWallet.id,
      amount: 5000,
      status: 'PENDING',
    },
  })
  //console.log(`✅ Sample withdrawal request seeded`)

  // Sample COD Collection first
  const codCollection = await prisma.codCollection.upsert({
    where: { id: 'seed-cod-collection-001' },
    update: {},
    create: {
      id: 'seed-cod-collection-001',
      userId: pmUser.id,
      bookingId: sampleBooking.id,
      amount: 15000,
      collectionDate: twoDaysAgo,
      collectionMethod: 'MANUAL',
      status: 'COLLECTED',
    },
  })

  // Sample COD Remittance
  await prisma.codRemittance.upsert({
    where: { id: 'seed-cod-remittance-001' },
    update: {},
    create: {
      id: 'seed-cod-remittance-001',
      collectionId: codCollection.id,
      userId: pmUser.id,
      amount: 15000,
      remittanceMethod: 'MANUAL',
      remittanceDate: yesterday,
      bankReferenceNumber: 'BANK' + Date.now(),
      status: 'COMPLETED',
    },
  })
  //console.log(`✅ Sample COD remittance seeded`)

  // Sample Audit Log
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'CREATE',
      resource: 'Booking',
      result: 'GRANTED',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
    },
  })
  //console.log(`✅ Sample audit log seeded`)

  //console.log('✅ Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
