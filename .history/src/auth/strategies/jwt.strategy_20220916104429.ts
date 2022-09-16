import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from 'src/@generated/prisma-nestjs-graphql/user/user.model';
import { UsersService } from 'src/users/users.service';

// メールアドレスとパスワードによる認証後に発行されたJWTトークンを使った認証のためのJwtStrategyを作成
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload): Promise<User | null> {
    return this.usersService.findUnique({ where: { email: payload.email } });
  }
}
