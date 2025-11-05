namespace CarMaintenance.Api.DTOs
{
    public class ChatMessageDto
    {
        public int Id { get; set; }
        public string User { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string? GroupName { get; set; }
    }
}