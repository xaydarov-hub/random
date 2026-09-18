export type AppErrorCode =
  | 'AUTH_REQUIRED'
  | 'INSTAGRAM_NOT_CONNECTED'
  | 'INSTAGRAM_TOKEN_EXPIRED'
  | 'INSTAGRAM_PERMISSION_DENIED'
  | 'MEDIA_NOT_ACCESSIBLE'
  | 'RATE_LIMITED'
  | 'INVALID_INSTAGRAM_URL'
  | 'NO_ELIGIBLE_PARTICIPANTS'
  | 'IMPORT_INVALID'
  | 'DRAW_ALREADY_IN_PROGRESS'
  | 'WINNER_COUNT_EXCEEDS_POOL'
  | 'GIVEAWAY_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR';

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  toJSON() {
    return {
      error: true,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

// Uzbek error messages for UI display
export const ERROR_MESSAGES: Record<AppErrorCode, string> = {
  AUTH_REQUIRED: "Iltimos, tizimga kiring.",
  INSTAGRAM_NOT_CONNECTED: "Instagram hisobi ulanmagan. Sozlamalardan hisobni ulang.",
  INSTAGRAM_TOKEN_EXPIRED: "Instagram sessiyasi eskirgan. Hisobni qayta ulang.",
  INSTAGRAM_PERMISSION_DENIED: "Bu postga kirish uchun yetarli ruxsat yo'q.",
  MEDIA_NOT_ACCESSIBLE:
    "Bu post avtomatik yuklanmadi. Instagram hisobi ulang yoki ishtirokchilarni import qiling.",
  RATE_LIMITED:
    "Instagram API limiti vaqtincha tugadi. Keyinroq qayta urinib ko'ring.",
  INVALID_INSTAGRAM_URL:
    "Noto'g'ri Instagram havolasi. Reel yoki post havolasini kiriting.",
  NO_ELIGIBLE_PARTICIPANTS:
    "Filtrlardan keyin ishtirokchi qolmadi. Filtrlarni tekshiring va qayta urining.",
  IMPORT_INVALID: "Fayl noto'g'ri formatda. CSV yoki TXT fayl yuklang.",
  DRAW_ALREADY_IN_PROGRESS: "Tanlov amalga oshirilmoqda. Biroz kuting.",
  WINNER_COUNT_EXCEEDS_POOL:
    "G'oliblar soni ishtirokchilar sonidan ko'p bo'lishi mumkin emas.",
  GIVEAWAY_NOT_FOUND: "Giveaway topilmadi.",
  UNAUTHORIZED: "Ruxsat yo'q.",
  VALIDATION_ERROR: "Ma'lumotlar noto'g'ri.",
  UNKNOWN_ERROR: "Noma'lum xato yuz berdi. Qayta urining.",
};

export function getErrorMessage(code: AppErrorCode): string {
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.UNKNOWN_ERROR;
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function normalizeError(error: unknown): AppError {
  if (isAppError(error)) return error;
  if (error instanceof Error) {
    return new AppError('UNKNOWN_ERROR', error.message);
  }
  return new AppError('UNKNOWN_ERROR', 'Unknown error occurred');
}
