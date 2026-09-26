import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')
  
  // 1. Clean existing data (useful for a fresh start in hackathons)
  await prisma.stockLedger.deleteMany()
  await prisma.stockMove.deleteMany()
  await prisma.stockOperation.deleteMany()
  await prisma.stockQuant.deleteMany()
  await prisma.product.deleteMany()
  await prisma.location.deleteMany()
  await prisma.warehouse.deleteMany()
  await prisma.user.deleteMany()

  // 2. Create Users
  const passwordHash = await bcrypt.hash('password123', 10)
  
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@stocksense.com',
      passwordHash,
      role: 'ADMIN'
    }
  })

  const manager = await prisma.user.create({
    data: {
      name: 'Inventory Manager',
      email: 'manager@stocksense.com',
      passwordHash,
      role: 'INVENTORY_MANAGER'
    }
  })

  const staff = await prisma.user.create({
    data: {
      name: 'Warehouse Staff',
      email: 'staff@stocksense.com',
      passwordHash,
      role: 'WAREHOUSE_STAFF'
    }
  })

  // 3. Create Warehouses
  const mainWarehouse = await prisma.warehouse.create({
    data: {
      name: 'Silicon Valley Central',
      code: 'SVC'
    }
  })

  const secondaryWarehouse = await prisma.warehouse.create({
    data: {
      name: 'New York Hub',
      code: 'NYH'
    }
  })

  // 4. Create Locations
  const vendorLocation = await prisma.location.create({
    data: {
      name: 'Vendors (External)',
      isInternal: false,
    }
  })

  const customerLocation = await prisma.location.create({
    data: {
      name: 'Customers (External)',
      isInternal: false,
    }
  })

  const rackA = await prisma.location.create({
    data: {
      name: 'Rack A - Electronics',
      warehouseId: mainWarehouse.id,
      isInternal: true
    }
  })

  const rackB = await prisma.location.create({
    data: {
      name: 'Rack B - Furniture',
      warehouseId: mainWarehouse.id,
      isInternal: true
    }
  })

  const prodFloor = await prisma.location.create({
    data: {
      name: 'Production Floor',
      warehouseId: secondaryWarehouse.id,
      isInternal: true
    }
  })

  // 5. Create Products
  const products = [
    {
      name: 'Wireless Mechanical Keyboard',
      sku: 'ELEC-KEY-001',
      category: 'Electronics',
      uom: 'Units',
      minReorderLevel: 50,
    },
    {
      name: 'Ergonomic Office Chair',
      sku: 'FURN-CHR-002',
      category: 'Furniture',
      uom: 'Units',
      minReorderLevel: 20,
    },
    {
      name: '27-inch 4K Monitor',
      sku: 'ELEC-MON-003',
      category: 'Electronics',
      uom: 'Units',
      minReorderLevel: 10,
    },
    {
      name: 'Standing Desk - Motorized',
      sku: 'FURN-DSK-004',
      category: 'Furniture',
      uom: 'Units',
      minReorderLevel: 5,
    }
  ]

  for (const prod of products) {
    await prisma.product.create({
      data: prod
    })
  }
  
  console.log('Seed completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
