import { prisma } from './index'

async function seedVehicleConfigurations() {
  const configurations = [
    {
      vehicleType: 'BIKE',
      displayName: 'Bike',
      description: 'Small parcels up to 5kg',
      defaultWeight: 5,
      maxWeight: 5,
      icon: 'bike',
      isActive: true,
      sortOrder: 1,
    },
    {
      vehicleType: 'AUTO',
      displayName: 'Auto',
      description: 'Medium parcels up to 15kg',
      defaultWeight: 15,
      maxWeight: 15,
      icon: 'auto',
      isActive: true,
      sortOrder: 2,
    },
    {
      vehicleType: 'MINI_VAN',
      displayName: 'Mini Van',
      description: 'Large parcels up to 30kg',
      defaultWeight: 30,
      maxWeight: 30,
      icon: 'van',
      isActive: true,
      sortOrder: 3,
    },
    {
      vehicleType: 'VAN',
      displayName: 'Van',
      description: 'Heavy parcels up to 50kg',
      defaultWeight: 50,
      maxWeight: 50,
      icon: 'van',
      isActive: true,
      sortOrder: 4,
    },
  ]

  for (const config of configurations) {
    await prisma.vehicleConfiguration.upsert({
      where: { vehicleType: config.vehicleType },
      update: config,
      create: config,
    })
  }

  console.log('Vehicle configurations seeded successfully')
}

seedVehicleConfigurations()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
