export type PixTokenStatus = "active" | "expired" | "exhausted";

export interface PixToken {
  id: string;
  code: string;
  totalSeconds: number;
  remainingSeconds: number;
  expiresAt: string;
  createdAt: string;
  status: PixTokenStatus;
  payment: {
    amountCents: number;
    externalPaymentId: string | null;
  };
}

export interface AppSetting {
  pixTokenValidityDays: number;
  pixTokenMinRemainingMinutes: number;
}

export type UpdateAppSettingDto = Partial<AppSetting>;
