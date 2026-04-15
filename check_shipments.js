const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
p.shipment.findMany({select:{trackingCode:true,status:true},take:10})
  .then(r => { console.log(JSON.stringify(r, null, 2)); return p.$disconnect(); })
  .catch(e => { console.error(e); p.$disconnect(); });
