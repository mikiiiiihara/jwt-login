import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/@generated/prisma-nestjs-graphql/user/user.model';
import * as bcrypt from 'bcrypt';
import { LoginResponse } from 'src/auth/dto/login-response';
import { Tokens } from './types/tokens.type';
import { JwtPayload } from './types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findUnique({
      where: { email: email },
    });
    // 入力されたパスワードとハッシュ化されたパスワードが正しいか比較
    if (user && bcrypt.compareSync(password, user.password)) {
      return user;
    }

    return null;
  }

  async login(user: User): Promise<LoginResponse> {
    const tokens = await this.getTokens(user);
    // loginの戻り値にリフレッシュトークンを追加しています。また、ハッシュ化したリフレッシュトークンをUserに保存しています。
    await this.updateHashedRefreshToken(user, tokens.refresh_token);

    return {
      // 認証を通ったUserにJWTトークンを発行
      ...tokens,
      user: user,
    };
  }

  async refreshToken(
    user: User,
    authorization: string,
  ): Promise<LoginResponse> {
    const refreshToken = authorization.replace('Bearer', '').trim();

    if (!bcrypt.compareSync(refreshToken, user.hashedRefreshToken)) {
      throw new UnauthorizedException();
    }

    const tokens = await this.getTokens(user);
    await this.updateHashedRefreshToken(user, tokens.refresh_token);

    return {
      ...tokens,
      user: user,
    };
  }

  // Userに保存されたリフレッシュトークンのハッシュ値を空にしています。
  async logout(user: User): Promise<boolean> {
    await this.usersService.update({
      where: { id: user.id },
      data: { hashedRefreshToken: { set: null } },
    });

    return true;
  }
  async updateHashedRefreshToken(
    user: User,
    refreshToken: string,
  ): Promise<void> {
    const hashedRefreshToken = bcrypt.hashSync(refreshToken, 10);
    await this.usersService.update({
      where: { id: user.id },
      data: { hashedRefreshToken: { set: hashedRefreshToken } },
    });
  }

  async getTokens(user: User): Promise<Tokens> {
    const payload: JwtPayload = { email: user.email, sub: user.id };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }
}
