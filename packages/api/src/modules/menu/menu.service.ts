// ═══════════════════════════════════════════
// DineSmart OS — Menu Module (Service)
// ═══════════════════════════════════════════

import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { POPULAR_THRESHOLD } from '@dinesmart/shared';

// ── Categories ───────────────────────────

export async function getCategories(restaurantId: string) {
  return prisma.category.findMany({
    where: { restaurantId },
    include: { _count: { select: { menuItems: true } } },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function createCategory(restaurantId: string, data: { name: string; sortOrder?: number }) {
  return prisma.category.create({
    data: { ...data, restaurantId, sortOrder: data.sortOrder ?? 0 },
  });
}

export async function updateCategory(restaurantId: string, categoryId: string, data: Record<string, unknown>) {
  const cat = await prisma.category.findFirst({ where: { id: categoryId, restaurantId } });
  if (!cat) throw new AppError(404, 'Category not found');
  return prisma.category.update({ where: { id: categoryId }, data });
}

export async function deleteCategory(restaurantId: string, categoryId: string) {
  const cat = await prisma.category.findFirst({ where: { id: categoryId, restaurantId } });
  if (!cat) throw new AppError(404, 'Category not found');
  return prisma.category.delete({ where: { id: categoryId } });
}

// ── Menu Items ───────────────────────────

export async function getMenuItems(restaurantId: string, categoryId?: string) {
  const where: Record<string, unknown> = { restaurantId };
  if (categoryId) where['categoryId'] = categoryId;

  return prisma.menuItem.findMany({
    where,
    include: {
      category: { select: { name: true } },
      variants: true,
      menuItemAddons: { include: { addon: true } },
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
}

export async function createMenuItem(restaurantId: string, data: {
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isVeg?: boolean;
  preparationTimeMinutes?: number;
  sortOrder?: number;
  tags?: string[];
  variants?: Array<{ name: string; additionalPrice: number }>;
  addonIds?: string[];
}) {
  const category = await prisma.category.findFirst({
    where: { id: data.categoryId, restaurantId },
  });
  if (!category) throw new AppError(404, 'Category not found');

  const { variants, addonIds, ...itemData } = data;

  return prisma.$transaction(async (tx) => {
    const menuItem = await tx.menuItem.create({
      data: {
        ...itemData,
        restaurantId,
        description: itemData.description ?? '',
        isVeg: itemData.isVeg ?? false,
        preparationTimeMinutes: itemData.preparationTimeMinutes ?? 15,
        sortOrder: itemData.sortOrder ?? 0,
        tags: itemData.tags ?? [],
      },
    });

    if (variants && variants.length > 0) {
      await tx.menuItemVariant.createMany({
        data: variants.map((v) => ({
          menuItemId: menuItem.id,
          name: v.name,
          additionalPrice: v.additionalPrice,
        })),
      });
    }

    if (addonIds && addonIds.length > 0) {
      await tx.menuItemAddon.createMany({
        data: addonIds.map((addonId) => ({
          menuItemId: menuItem.id,
          addonId,
        })),
      });
    }

    return tx.menuItem.findUnique({
      where: { id: menuItem.id },
      include: { variants: true, menuItemAddons: { include: { addon: true } } },
    });
  });
}

export async function updateMenuItem(restaurantId: string, itemId: string, data: Record<string, unknown>) {
  const item = await prisma.menuItem.findFirst({ where: { id: itemId, restaurantId } });
  if (!item) throw new AppError(404, 'Menu item not found');

  const { variants, addonIds, ...updateData } = data as {
    variants?: Array<{ name: string; additionalPrice: number }>;
    addonIds?: string[];
    [key: string]: unknown;
  };

  return prisma.$transaction(async (tx) => {
    await tx.menuItem.update({ where: { id: itemId }, data: updateData });

    if (variants !== undefined) {
      await tx.menuItemVariant.deleteMany({ where: { menuItemId: itemId } });
      if (variants.length > 0) {
        await tx.menuItemVariant.createMany({
          data: variants.map((v) => ({
            menuItemId: itemId,
            name: v.name,
            additionalPrice: v.additionalPrice,
          })),
        });
      }
    }

    if (addonIds !== undefined) {
      await tx.menuItemAddon.deleteMany({ where: { menuItemId: itemId } });
      if (addonIds.length > 0) {
        await tx.menuItemAddon.createMany({
          data: addonIds.map((addonId) => ({ menuItemId: itemId, addonId })),
        });
      }
    }

    return tx.menuItem.findUnique({
      where: { id: itemId },
      include: { variants: true, menuItemAddons: { include: { addon: true } }, category: true },
    });
  });
}

export async function deleteMenuItem(restaurantId: string, itemId: string) {
  const item = await prisma.menuItem.findFirst({ where: { id: itemId, restaurantId } });
  if (!item) throw new AppError(404, 'Menu item not found');
  return prisma.menuItem.delete({ where: { id: itemId } });
}

export async function toggleAvailability(restaurantId: string, itemId: string) {
  const item = await prisma.menuItem.findFirst({ where: { id: itemId, restaurantId } });
  if (!item) throw new AppError(404, 'Menu item not found');
  return prisma.menuItem.update({
    where: { id: itemId },
    data: { isAvailable: !item.isAvailable },
  });
}

// ── Addons ───────────────────────────────

export async function getAddons(restaurantId: string) {
  return prisma.addon.findMany({ where: { restaurantId }, orderBy: { name: 'asc' } });
}

export async function createAddon(restaurantId: string, data: { name: string; price: number }) {
  return prisma.addon.create({ data: { ...data, restaurantId } });
}

export async function updateAddon(restaurantId: string, addonId: string, data: Record<string, unknown>) {
  const addon = await prisma.addon.findFirst({ where: { id: addonId, restaurantId } });
  if (!addon) throw new AppError(404, 'Addon not found');
  return prisma.addon.update({ where: { id: addonId }, data });
}

export async function deleteAddon(restaurantId: string, addonId: string) {
  const addon = await prisma.addon.findFirst({ where: { id: addonId, restaurantId } });
  if (!addon) throw new AppError(404, 'Addon not found');
  return prisma.addon.delete({ where: { id: addonId } });
}

// ── Public Menu ──────────────────────────

export async function getPublicMenu(restaurantSlug: string, tableId: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: restaurantSlug },
    select: { id: true, name: true, logoUrl: true, isActive: true, bannerText: true, bannerImageUrl: true },
  });

  if (!restaurant || !restaurant.isActive) {
    throw new AppError(404, 'Restaurant not found');
  }

  const isNumericTableId = !isNaN(Number(tableId));
  const table = await prisma.table.findFirst({
    where: { 
      restaurantId: restaurant.id,
      OR: [
        { id: tableId },
        ...(isNumericTableId ? [{ number: Number(tableId) }] : [])
      ]
    },
    select: { id: true, number: true, branchId: true },
  });

  if (!table) {
    throw new AppError(404, 'Table not found');
  }

  const [categories, branch] = await Promise.all([
    prisma.category.findMany({
      where: { restaurantId: restaurant.id, isActive: true },
      include: {
        menuItems: {
          where: { isAvailable: true },
          include: {
            variants: true,
            menuItemAddons: { include: { addon: { select: { id: true, name: true, price: true } } } },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.branch.findUnique({
      where: { id: table.branchId },
      select: { 
        allowOnlinePayment: true, 
        allowOrderModification: true, 
        requireOrderVerification: true 
      }
    })
  ]);

  return {
    restaurant: { 
      id: restaurant.id, 
      name: restaurant.name, 
      logoUrl: restaurant.logoUrl,
      bannerText: (restaurant as any).bannerText,
      bannerImageUrl: (restaurant as any).bannerImageUrl
    },
    branch: branch || {
      allowOnlinePayment: true,
      allowOrderModification: true,
      requireOrderVerification: false
    },
    table: { id: table.id, number: table.number },
    categories: categories.map((cat) => ({
      ...cat,
      items: cat.menuItems.map((item) => ({
        ...item,
        isPopular: item.orderCount >= POPULAR_THRESHOLD,
        addons: item.menuItemAddons.map((mia) => mia.addon),
      })),
    })),
  };
}

export async function getPublicHistory(restaurantSlug: string, phone: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: restaurantSlug },
    select: { id: true },
  });

  if (!restaurant) {
    throw new AppError(404, 'Restaurant not found');
  }

  const normalizedPhone = phone.replace(/\s+/g, '');

  const customer = await prisma.customer.findFirst({
    where: {
      restaurantId: restaurant.id,
      phone: { endsWith: normalizedPhone.replace(/^\+91/, '') }
    },
  });

  if (!customer) {
    return []; // No history for this customer phone yet
  }

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    include: {
      branch: { select: { name: true } },
      items: { include: { menuItem: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return orders;
}

export async function sendOtp(phone: string) {
  const accountSid = process.env['TWILIO_ACCOUNT_SID'];
  const authToken = process.env['TWILIO_AUTH_TOKEN'];
  const serviceSid = process.env['TWILIO_VERIFY_SERVICE_SID'];

  // Formatted phone
  const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

  if (!accountSid || !authToken || !serviceSid) {
    throw new AppError(500, 'Twilio service is not configured');
  }

  const token = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const params = new URLSearchParams({ To: formattedPhone, Channel: 'sms' });

  const res = await fetch(`https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await res.json() as any;
  if (!res.ok) {
    console.error('Twilio Send Error', { status: res.status, data });
    if ([401, 403, 404].includes(res.status)) {
      throw new AppError(500, `Twilio configuration error: ${data.message || 'Check your SID and Token'} (${res.status})`);
    }
    throw new AppError(res.status, data.message || 'Failed to send OTP via Twilio');
  }

  return { success: true };
}

export async function verifyOtp(restaurantSlug: string, phone: string, code: string, name?: string) {
  const accountSid = process.env['TWILIO_ACCOUNT_SID'];
  const authToken = process.env['TWILIO_AUTH_TOKEN'];
  const serviceSid = process.env['TWILIO_VERIFY_SERVICE_SID'];
  
  // Ensure phone and code have no spaces or special characters
  const cleanPhone = phone.replace(/\s+/g, '');
  const cleanCode = code.replace(/\s+/g, '');
  const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone}`;

  let isValid = false;

  if (!accountSid || !authToken || !serviceSid) {
    throw new AppError(500, 'Twilio service is not configured');
  }

  // Twilio Verification
  const token = Buffer.from(`${accountSid.trim()}:${authToken.trim()}`).toString('base64');
  const params = new URLSearchParams({ To: formattedPhone, Code: cleanCode });

  const res = await fetch(`https://verify.twilio.com/v2/Services/${serviceSid?.trim()}/VerificationCheck`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await res.json() as any;
  if (!res.ok) {
    console.error('Twilio Verify Error', { status: res.status, data });
    if ([401, 403, 404].includes(res.status)) {
      throw new AppError(500, `Twilio configuration error: ${data.message || 'Verification session expired or not found'} (${res.status})`);
    }
    throw new AppError(400, data.message || 'Invalid or expired OTP Code');
  }

  // Twilio returns 200 OK even if the code is wrong, but with valid: false
  if (data.status === 'approved' && data.valid === true) {
    isValid = true;
  } else {
    throw new AppError(400, 'Invalid OTP Code');
  }

  if (isValid) {
    // Upsert Customer
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: restaurantSlug },
    });

    if (!restaurant) throw new AppError(404, 'Restaurant not found');

    const customer = await prisma.customer.findFirst({
      where: { restaurantId: restaurant.id, phone: { endsWith: cleanPhone.replace(/^\+91/, '') } },
    });

    let customerId = customer?.id;

    if (!customer) {
      const newCustomer = await prisma.customer.create({
        data: {
          restaurantId: restaurant.id,
          phone: cleanPhone,
          name: name || null,
        },
      });
      customerId = newCustomer.id;
    } else if (name) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { name },
      });
    }

    // Ensure loyalty account exists
    const loyalty = await prisma.loyaltyAccount.findUnique({
      where: { customerId: customerId! }
    });

    if (!loyalty) {
      await prisma.loyaltyAccount.create({
        data: {
          restaurantId: restaurant.id,
          customerId: customer.id,
          points: 0,
          totalEarned: 0,
          totalRedeemed: 0,
        }
      });
    }

    return { success: true, customer };
  }

  throw new AppError(400, 'Verification failed');
}
