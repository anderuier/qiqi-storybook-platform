import { memo } from "react";

/**
 * 通知设置状态
 */
export interface NotificationsState {
  newFeatures: boolean;
  weeklyDigest: boolean;
  comments: boolean;
  likes: boolean;
}

/**
 * 通知设置标签组件
 */
interface NotificationsTabProps {
  notifications: NotificationsState;
  setNotifications: (state: NotificationsState | ((prev: NotificationsState) => NotificationsState)) => void;
}

const notificationItems = [
  { key: "newFeatures" as const, label: "新功能通知", desc: "当有新功能上线时通知我" },
  { key: "weeklyDigest" as const, label: "每周精选", desc: "每周发送精选绘本作品" },
  { key: "comments" as const, label: "评论通知", desc: "当有人评论我的作品时通知我" },
  { key: "likes" as const, label: "点赞通知", desc: "当有人点赞我的作品时通知我" },
];

export const NotificationsTab = memo(function NotificationsTab({ notifications, setNotifications }: NotificationsTabProps) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">通知设置</h2>

      <div className="space-y-4">
        {notificationItems.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between p-4 rounded-xl border border-border/50"
          >
            <div>
              <h3 className="font-medium">{item.label}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
            <button
              onClick={() =>
                setNotifications({
                  ...notifications,
                  [item.key]: !notifications[item.key],
                })
              }
              className={`w-12 h-6 rounded-full transition-colors ${
                notifications[item.key]
                  ? "bg-mint"
                  : "bg-muted"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  notifications[item.key]
                    ? "translate-x-6"
                    : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground mt-4">
        通知功能即将上线，敬请期待
      </p>
    </div>
  );
});
