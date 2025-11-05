using CarCommun.Core.Models.Community;
using Microsoft.AspNetCore.SignalR;

namespace CarCommun.Api.Hubs
{
    public class CommunityHub : Hub
    {
        public async Task SubscribeToFeed(string category)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"feed_{category}");
        }

        public async Task UnsubscribeFromFeed(string category)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"feed_{category}");
        }

        public async Task BroadcastPost(Post post)
        {
            await Clients.Group($"feed_{post.Category ?? "general"}").SendAsync("NewPost", post);
        }

        public async Task BroadcastNotification(Notification notification)
        {
            await Clients.User(notification.UserId).SendAsync("NewNotification", notification);
        }

        public async Task JoinUserGroup(string userId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }

        public async Task LeaveUserGroup(string userId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
        }
    }
}