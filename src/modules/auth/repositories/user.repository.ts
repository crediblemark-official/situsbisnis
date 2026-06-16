import { db } from "@/modules/shared/core/db";

/**
 * Mengambil data user berdasarkan ID.
 */
export async function findUserById(userId: string) {
    return db.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
        }
    });
}

/**
 * Mengambil banyak user berdasarkan daftar ID.
 */
export async function findUsersByIds(userIds: string[]) {
    return db.user.findMany({
        where: { id: { in: userIds } },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true
        }
    });
}

/**
 * Mencari user berdasarkan email.
 */
export async function findUserByEmail(email: string) {
    return db.user.findUnique({
        where: { email }
    });
}

/**
 * Mencari user berdasarkan email (kembalian minimal/terbatas).
 */
export async function findUserByEmailLimited(email: string) {
    return db.user.findUnique({
        where: { email },
        select: { id: true, name: true, email: true, role: true }
    });
}

/**
 * Mencari user berdasarkan nomor telepon.
 */
export async function findUserByPhone(phone: string) {
    return db.user.findUnique({
        where: { phone }
    });
}

/**
 * Membuat user baru.
 */
export async function createUser(data: any) {
    return db.user.create({
        data
    });
}

/**
 * Mengambil semua user (admin platform).
 */
export async function findAllUsers() {
    return db.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
            createdAt: true
        }
    });
}

/**
 * Mengelompokkan jumlah postingan per pengguna.
 */
export async function countPostsGroupedByAuthor(siteId?: string) {
    return db.post.groupBy({
        by: ["authorId"],
        _count: {
            id: true
        },
        where: {
            ...(siteId ? { siteId } : {}),
            published: true
        }
    });
}

/**
 * Memperbarui data profil user.
 */
export async function updateUser(id: string, data: any) {
    return db.user.update({
        where: { id },
        data
    });
}

/**
 * Menghapus semua postingan user.
 */
export async function deleteUserPosts(userId: string) {
    return db.post.deleteMany({
        where: { authorId: userId }
    });
}

/**
 * Menghapus user secara permanen.
 */
export async function deleteUser(userId: string) {
    return db.user.delete({
        where: { id: userId }
    });
}

/**
 * Mengambil data semua user terurut desc berdasarkan tanggal daftar (admin platform).
 */
export async function findAdminUsers() {
    return db.user.findMany({
        orderBy: {
            createdAt: "desc"
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            referralCode: true,
            _count: {
                select: { referrals: true }
            }
        }
    });
}
