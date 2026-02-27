const { prisma } = require("../db");

function mapOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    order_id: row.orderId,
    customer_name: row.customerName,
    phone_number: row.phoneNumber,
    delivery_type: row.deliveryType,
    delivery_address: row.deliveryAddress || "",
    notes: row.notes || "",
    payment_proof_path: row.paymentProofPath || "",
    subtotal: row.subtotal,
    status: row.status,
    items_json: row.itemsJson,
    items: JSON.parse(row.itemsJson || "[]"),
    created_at: row.createdAt
  };
}

async function createOrder(payload) {
  const paymentProofPath = String(
    payload.paymentProofPath || payload.payment_proof_path || payload.payment_proof_url || ""
  ).trim();

  const row = await prisma.order.create({
    data: {
      orderId: payload.order_id,
      customerName: payload.customer_name,
      phoneNumber: payload.phone_number,
      deliveryType: payload.delivery_type,
      deliveryAddress: payload.delivery_address || "",
      notes: payload.notes || "",
      paymentProofPath,
      subtotal: Number(payload.subtotal || 0),
      status: payload.status || "New",
      itemsJson: payload.items_json
    }
  });
  return mapOrder(row);
}

async function getByOrderId(orderId) {
  const row = await prisma.order.findUnique({ where: { orderId } });
  return mapOrder(row);
}

async function listOrders() {
  const rows = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(mapOrder);
}

async function updateStatus(id, status) {
  return prisma.order.update({
    where: { id: Number(id) },
    data: { status }
  });
}

module.exports = {
  createOrder,
  getByOrderId,
  listOrders,
  updateStatus
};
