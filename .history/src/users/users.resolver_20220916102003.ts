import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import * as bcrypt from 'bcrypt';
import { User } from 'src/@generated/prisma-nestjs-graphql/user/user.model';
import { CreateOneUserArgs } from 'src/@generated/prisma-nestjs-graphql/user/create-one-user.args';
import { UsersService } from 'src/users/users.service';
import { FindFirstUserArgs } from 'src/@generated/prisma-nestjs-graphql/user/find-first-user.args';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly userService: UsersService) {}

  @Query(() => User)
  // 認証されたUserのみがuserを実行できるよう設定
  @UseGuards(JwtAuthGuard)
  user(@Args() args: FindFirstUserArgs) {
    return this.userService.findFirst(args);
  }

  @Mutation(() => User)
  async createUser(@Args() args: CreateOneUserArgs) {
    // ラウンド数を10でパスワードをハッシュ化
    args.data.password = await bcrypt.hash(args.data.password, 10);
    return this.userService.createUser(args);
  }
}
