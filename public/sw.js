self.addEventListener("push", (event) => {
  let data = { title: "deeps 💗", body: "A little hello from deeps", url: "/" };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch {}
  event.waitUntil(self.registration.showNotification(data.title || "deeps 💗", {
    body: data.body || "A little hello from deeps",
    data: { url: data.url || "/" },
    tag: "deeps-proactive",
    renotify: false
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
    for (const client of windows) {
      if (client.url.startsWith(self.location.origin) && "focus" in client) {
        client.navigate(target); return client.focus();
      }
    }
    return clients.openWindow(target);
  }));
});
