import { Lock, Shield, Eye, EyeOff, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * 密码表单状态
 */
export interface PasswordForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * 账户安全标签组件
 */
interface SecurityTabProps {
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  passwordForm: PasswordForm;
  setPasswordForm: (form: PasswordForm | ((prev: PasswordForm) => PasswordForm)) => void;
  isSaving: boolean;
  passwordError: string | null;
  passwordSuccess: boolean;
  onChangePassword: () => void;
}

export function SecurityTab({
  showPassword,
  setShowPassword,
  passwordForm,
  setPasswordForm,
  isSaving,
  passwordError,
  passwordSuccess,
  onChangePassword,
}: SecurityTabProps) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">账户安全</h2>

      <div className="space-y-6">
        {/* 修改密码 */}
        <div className="p-5 rounded-xl border border-border/50 bg-muted/30">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-coral" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">登录密码</h3>
              <p className="text-sm text-muted-foreground mb-4">
                定期更换密码可以提高账户安全性
              </p>

              {/* 密码错误/成功提示 */}
              {passwordError && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  密码修改成功
                </div>
              )}

              <div className="space-y-3">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="当前密码"
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-border focus:border-coral focus:outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="新密码（至少6位）"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border focus:border-coral focus:outline-none"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="确认新密码"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border focus:border-coral focus:outline-none"
                />
                <Button
                  onClick={onChangePassword}
                  disabled={isSaving}
                  size="sm"
                  className="bg-coral hover:bg-coral/90 text-white rounded-full"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      修改中...
                    </>
                  ) : (
                    "修改密码"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 两步验证 */}
        <div className="p-5 rounded-xl border border-border/50 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-mint/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-mint" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">两步验证</h3>
                <p className="text-sm text-muted-foreground">
                  开启后登录时需要输入手机验证码
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="rounded-full" disabled>
              即将上线
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
