import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '../common/types';

@Injectable()
export class UsersService {
  private users: User[] = [
    { id: 'u-1', email: 'demo@climb.local', password: 'demo123', name: 'Користувач', savedTrailIds: ['trail-2'] },
  ];
  private counter = this.users.length + 1;

  findByCredentials(email: string, password: string): User {
    const user = this.users.find((u) => u.email === email && u.password === password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  findById(id: string): User {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new UnauthorizedException('Invalid session');
    return user;
  }

  emailExists(email: string): boolean {
    const normalized = email.trim().toLowerCase();
    return this.users.some((u) => u.email === normalized);
  }

  register(input: { email: string; password: string; name: string }): User {
    const email = input.email.trim().toLowerCase();
    if (this.users.some((u) => u.email === email)) {
      throw new BadRequestException('Користувач з таким email вже існує');
    }

    const user: User = {
      id: `u-${this.counter++}`,
      email,
      password: input.password,
      name: input.name.trim() || 'Новий користувач',
      savedTrailIds: [],
    };

    this.users.push(user);
    return user;
  }

  changePassword(input: { userId: string; oldPassword: string; newPassword: string }): void {
    const user = this.findById(input.userId);
    if (user.password !== input.oldPassword) {
      throw new BadRequestException('Старий пароль невірний');
    }
    user.password = input.newPassword;
  }

  toggleSavedTrail(userId: string, trailId: string): User {
    const user = this.findById(userId);
    user.savedTrailIds = user.savedTrailIds.includes(trailId)
      ? user.savedTrailIds.filter((id) => id !== trailId)
      : [...user.savedTrailIds, trailId];
    return user;
  }
}
