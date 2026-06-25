import { prisma } from "../config/prisma.js";
import { NotFoundError } from "../lib/errors.js";
import { signToken } from "../utils/jwt.js";

// 生成随机昵称
function generateNickname() {
    const suffix = Math.floor(100000 + Math.random() * 900000);
    return `麻雀${suffix}`;
}

// 格式化返回给前端的用户信息
function formatUser(user: {
    id: number;
    phone: string;
    created_at: Date;
    userinfo: { nickname: string | null; avatar: string | null } | null;
}) {
    return {
        id: user.id,
        phone: user.phone,
        nickname: user.userinfo?.nickname ?? null,
        avatar: user.userinfo?.avatar ?? null,
        createdAt: user.created_at,
    };
}

export class AuthService {
    // 手机号登录；用户不存在则自动注册
    async loginWithPhone(phone: string) {
        let isNewUser = false;

        let user = await prisma.user.findUnique({
            where: { phone },
            include: { userinfo: true },
        });

        if (!user) {
            isNewUser = true;
            user = await prisma.user.create({
                data: {
                    phone,
                    userinfo: {
                        create: {
                            nickname: generateNickname(),
                        },
                    },
                },
                include: { userinfo: true },
            });
        }

        const token = signToken({ userId: user.id, phone: user.phone });

        return {
            user: formatUser(user),
            token,
            isNewUser,
        };
    }

    // 根据用户 ID 获取完整用户信息
    async getProfile(userId: number) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { userinfo: true },
        });

        if (!user) {
            throw new NotFoundError("用户不存在");
        }

        return formatUser(user);
    }
}

// authService 鉴权服务单例
export const authService = new AuthService();
