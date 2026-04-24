// src/modules/contact/contact.service.ts
import { prisma } from "../../lib/prisma";


const createMessageIntoDB = async (payload: any) => {
  const result = await prisma.contactMessage.create({
    data: payload,
  });
  return result;
};

const getAllMessagesFromDB = async () => {
  return await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });
};

export const ContactService = {
  createMessageIntoDB,
  getAllMessagesFromDB,
};