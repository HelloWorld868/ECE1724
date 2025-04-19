"use server";

import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { EventType } from "@prisma/client";
import { uploadImageToGCS } from "@/lib/gcs-upload";

export async function createEvent(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const user = session?.user;

  if (!user) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name");
  const location = formData.get("location");
  const type = formData.get("type");
  const startTime = formData.get("startTime");
  const endTime = formData.get("endTime");
  const tierNames = formData.getAll("names[]").map((n) => n.toString());
  const prices = formData.getAll("prices[]").map((p) => parseInt(p.toString()));
  const quantities = formData
    .getAll("quantities[]")
    .map((q) => parseInt(q.toString()));
  
    // Upload image files
    const rawImageInputs = formData.getAll("images");

    // Filter out non-Files or files with empty names
    const imageFiles = rawImageInputs.filter(
      (file): file is File =>
        file instanceof File &&
        typeof file.name === "string" &&
        file.name.trim() !== "" &&
        file.size > 0
    );
    
    const imageUrls: string[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const filename = `${Date.now()}-${i}-${file.name}`;
      const url = await uploadImageToGCS(file, filename);
      imageUrls.push(url);
    }

    console.log("🧾 Final filtered images:", imageFiles.map(f => f.name));

  // 处理折扣码数据
  const discountCodes = [];
  const discountCodeFields = Array.from(formData.keys()).filter((key) =>
    key.match(/discountCodes\[.*?\]\.code/)
  );

  console.log("Found discount code fields:", discountCodeFields);

  for (const field of discountCodeFields) {
    // 从字段名中提取ID，例如从 "discountCodes[abc123].code" 提取 "abc123"
    const idMatch = field.match(/discountCodes\[(.*?)\]\.code/);
    if (!idMatch) continue;
    const id = idMatch[1];

    const code = formData.get(`discountCodes[${id}].code`) as string;
    const discountType = formData.get(
      `discountCodes[${id}].discountType`
    ) as string;
    const discountValue = parseFloat(
      formData.get(`discountCodes[${id}].discountValue`) as string
    );
    const maxUses = formData.get(`discountCodes[${id}].maxUses`) as string;
    const startDate = formData.get(`discountCodes[${id}].startDate`) as string;
    const endDate = formData.get(`discountCodes[${id}].endDate`) as string;

    console.log("Processing discount code:", {
      id,
      code,
      discountType,
      discountValue,
      maxUses,
      startDate,
      endDate,
    });

    if (code && discountType && !isNaN(discountValue)) {
      discountCodes.push({
        code,
        discountType,
        discountValue,
        maxUses: maxUses ? parseInt(maxUses) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        currentUses: 0,
      });
    }
  }

  // 显示所有要创建的折扣码详情
  if (discountCodes.length > 0) {
    console.log("\n=== DISCOUNT CODES TO BE CREATED ===");
    console.log(`Total discount codes: ${discountCodes.length}`);
    
    discountCodes.forEach((code, index) => {
      console.log(`\nDiscount code #${index + 1}:`);
      console.log(`Code: ${code.code}`);
      console.log(`Type: ${code.discountType}`);
      console.log(`Value: ${code.discountValue}`);
      console.log(`Max uses: ${code.maxUses || 'Unlimited'}`);
      console.log(`Valid from: ${code.startDate ? code.startDate.toLocaleString() : 'No start date'}`);
      console.log(`Valid until: ${code.endDate ? code.endDate.toLocaleString() : 'No end date'}`);
    });
    console.log("===================================\n");
  }

  console.log("Ticket tier names:", tierNames);
  console.log("Ticket tier prices:", prices);
  console.log("Ticket tier quantities:", quantities);

  if (!name || (name as string).trim() === "") {
    throw new Error("Event name is required");
  }

  if (!type || (type as EventType).trim() === "") {
    throw new Error("Event type is required");
  }

  if (!location || (location as string).trim() === "") {
    throw new Error("Event location is required");
  }

  if (!startTime) {
    throw new Error("Event start time is required");
  }

  if (!endTime) {
    throw new Error("Event end time is required");
  }

  if (new Date(startTime as string) >= new Date(endTime as string)) {
    throw new Error("Event end time must be after start time");
  }

  if (prices.length !== quantities.length || prices.length !== tierNames.length) {
    throw new Error("Ticket tier information mismatch");
  }

  const ticketTiers = prices.map((price, i) => ({
    name: tierNames[i],
    price,
    quantity: quantities[i],
  }));

  const uniquePrices = new Set(prices);
  if (uniquePrices.size !== prices.length) {
    throw new Error("Each ticket tier must have a unique price");
  }

  await prisma.event.create({
    data: {
      name: name as string,
      location: location as string,
      type: type as EventType,
      startTime: new Date(startTime as string),
      endTime: new Date(endTime as string),
      ownerid: user.id,
      TicketTiers: {
        create: ticketTiers,
      },
      discountCodes: {
        create: discountCodes,
      },
      ...(imageUrls.length > 0 && { images: imageUrls }),
    } satisfies Prisma.EventCreateInput,
  });

  return { success: true, userId: user.id };
}

export async function createRegistration(orderId: number) {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      user: true,
      event: true,
    },
  });
  if (!order) {
    throw new Error("Order not found");
  }
  const registration = await prisma.registration.findUnique({
    where: {
      qrCodeToken: order.id.toString(),
    },
  });
  if (registration) {
    return;
  }
  await prisma.registration.create({
    data: {
      checkedIn: false,
      checkInTime: new Date(),
      qrCodeToken: order.id.toString(),
      user: {
        connect: {
          id: order.userId,
        },
      },
      event: {
        connect: {
          id: order.eventId,
        },
      },
    },
  });
}
