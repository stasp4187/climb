import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ChangePasswordDto, CheckEmailDto, LoginDto, RegisterDto, ToggleSaveDto } from './dto';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @Post('login')
  login(@Body() body: LoginDto) {
    const user = this.usersService.findByCredentials(body.email, body.password);
    return { id: user.id, name: user.name, email: user.email, savedTrailIds: user.savedTrailIds };
  }

  @Post('register')
  register(@Body() body: RegisterDto) {
    const user = this.usersService.register(body);
    return { id: user.id, name: user.name, email: user.email, savedTrailIds: user.savedTrailIds };
  }

  @Post('check-email')
  checkEmail(@Body() body: CheckEmailDto) {
    return { exists: this.usersService.emailExists(body.email) };
  }

  @Post('toggle-save')
  toggleSave(@Body() body: ToggleSaveDto) {
    const user = this.usersService.toggleSavedTrail(body.userId, body.trailId);
    return { id: user.id, savedTrailIds: user.savedTrailIds };
  }

  @Post('change-password')
  changePassword(@Body() body: ChangePasswordDto) {
    this.usersService.changePassword(body);
    return { ok: true };
  }

}
