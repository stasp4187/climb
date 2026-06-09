import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(6) password!: string;
}

export class RegisterDto {
  @IsString() name!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(6) password!: string;
}

export class CheckEmailDto {
  @IsEmail() email!: string;
}

export class ToggleSaveDto {
  @IsString() userId!: string;
  @IsString() trailId!: string;
}

export class ChangePasswordDto {
  @IsString() userId!: string;
  @IsString() oldPassword!: string;
  @IsString() @MinLength(6) newPassword!: string;
}
