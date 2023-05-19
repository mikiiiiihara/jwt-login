import { UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { AuthService } from 'src/auth/auth.service';
import { LoginResponse } from 'src/auth/dto/login-response';
import { LoginUserInput } from 'src/auth/dto/login-user.input';
import { GqlAuthGuard } from 'src/auth/guards/gql-auth.guard';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => LoginResponse)
  @UseGuards(GqlAuthGuard)
  async login(
    @Args('loginUserInput') loginUserInput: LoginUserInput,
    @Context()
    @Context()
    context: { req: Request; res: Response; user: any },
  ) {
    const loginResponse = await this.authService.login(context.user);
    // Cookieにアクセストークンをセット
    context.res.cookie('hogehoge', loginResponse.accessToken, {
      httpOnly: true,
      sameSite: 'none',
      secure: false,
      // ここに必要なオプションを追加します
    });

    return loginResponse;
  }
  @Mutation(() => LoginResponse)
  @UseGuards(JwtRefreshAuthGuard)
  async refreshToken(@Context() context) {
    return this.authService.refreshToken(
      context.req.user,
      context.req.headers.authorization,
    );
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtRefreshAuthGuard)
  async logout(@Context() context) {
    return this.authService.logout(context.req.user);
  }
}
