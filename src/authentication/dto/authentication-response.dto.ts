export class AuthenticationResponseDto {
  id: number;
  email: string;
  name: string;
  position?: string | null;
  companyId: number;
}
