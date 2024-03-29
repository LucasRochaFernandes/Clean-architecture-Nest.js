import {
  Body,
  Controller,
  HttpCode,
  Post,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common'
import { compare } from 'bcryptjs'
import { z } from 'zod'
import { ZodValidationPipe } from 'src/pipes/zod-validation-pipes'
import { PrismaService } from 'src/prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'

const authenticateBodySchema = z.object({
  email: z.string().email(),
  password: z.string(),
})
type AuthenticateBodySchema = z.infer<typeof authenticateBodySchema>

@Controller('/sessions')
export class AuthenticateController {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(authenticateBodySchema))
  async handle(@Body() body: AuthenticateBodySchema) {
    const { email, password } = body

    const userByEmail = await this.prisma.user.findUnique({
      where: {
        email,
      },
    })
    if (!userByEmail) {
      throw new UnauthorizedException('User credentals do not match')
    }
    const isPasswordValid = await compare(password, userByEmail.password)

    if (!isPasswordValid) {
      throw new UnauthorizedException('User credentals do not match')
    }

    const accessToken = this.jwt.sign({ sub: userByEmail.id })

    return {
      access_token: accessToken,
    }
  }
}
