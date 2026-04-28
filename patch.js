const fs = require('fs');
let code = fs.readFileSync('app/actions/admin.ts', 'utf8');

const targetBulk = `    if (input.action === 'delete') {
      const result = await prisma.shipment.deleteMany({ where: { id: { in: ids } } });
      await logAudit(
        session.userId,
        'DELETE_SHIPMENT',
        \`Bulk deleted \${result.count} shipments\`,
      );
      revalidatePath('/[locale]/admin/shipments', 'page');
      return { success: true, count: result.count };
    }`;

const replaceBulk = `    if (input.action === 'delete') {
      const shipments = await prisma.shipment.findMany({
        where: { id: { in: ids } },
        include: { trucks: true, wagons: true }
      });
      
      const truckIds = shipments.flatMap((s) => s.trucks?.map((t) => t.id) || []);
      const wagonIds = shipments.flatMap((s) => s.wagons?.map((w) => w.id) || []);
      
      if (truckIds.length > 0) {
        await prisma.truck.updateMany({
          where: { id: { in: truckIds } },
          data: { status: 'available' }
        });
      }
      
      if (wagonIds.length > 0) {
        await prisma.wagon.updateMany({
          where: { id: { in: wagonIds } },
          data: { status: 'available' }
        });
      }

      const result = await prisma.shipment.deleteMany({ where: { id: { in: ids } } });
      await logAudit(
        session.userId,
        'DELETE_SHIPMENT',
        \`Bulk deleted \${result.count} shipments\`,
      );
      revalidatePath('/[locale]/admin/shipments', 'page');
      revalidatePath('/[locale]/admin/trucks', 'page');
      revalidatePath('/[locale]/admin/wagons', 'page');
      return { success: true, count: result.count };
    }`;

const targetSingle = `export async function deleteShipment(id: number) {
  try {
    const session = await getAdminSession();
    const shipment = await prisma.shipment.findUnique({ where: { id }, select: { trackingCode: true } });
    await prisma.shipment.delete({
      where: { id }
    });
    await logAudit(session?.userId, 'DELETE_SHIPMENT', \`Deleted shipment \${shipment?.trackingCode || id}\`);
    revalidatePath('/[locale]/admin/shipments', 'page');
    return { success: true };`;

const replaceSingle = `export async function deleteShipment(id: number) {
  try {
    const session = await getAdminSession();
    const shipment = await prisma.shipment.findUnique({ 
      where: { id },
      include: { trucks: true, wagons: true }
    });
    
    if (shipment) {
      if (shipment.trucks && shipment.trucks.length > 0) {
        await prisma.truck.updateMany({
          where: { id: { in: shipment.trucks.map((t) => t.id) } },
          data: { status: 'available' }
        });
      }
      if (shipment.wagons && shipment.wagons.length > 0) {
        await prisma.wagon.updateMany({
          where: { id: { in: shipment.wagons.map((w) => w.id) } },
          data: { status: 'available' }
        });
      }

      await prisma.shipment.delete({ where: { id } });
      await logAudit(session?.userId, 'DELETE_SHIPMENT', \`Deleted shipment \${shipment.trackingCode || id}\`);
    }

    revalidatePath('/[locale]/admin/shipments', 'page');
    revalidatePath('/[locale]/admin/trucks', 'page');
    revalidatePath('/[locale]/admin/wagons', 'page');
    return { success: true };`;

code = code.replace(targetBulk.replace(/\r\n/g, '\n'), replaceBulk);
code = code.replace(targetBulk, replaceBulk);
code = code.replace(targetSingle.replace(/\r\n/g, '\n'), replaceSingle);
code = code.replace(targetSingle, replaceSingle);

fs.writeFileSync('app/actions/admin.ts', code);
console.log('Replaced successfully');
