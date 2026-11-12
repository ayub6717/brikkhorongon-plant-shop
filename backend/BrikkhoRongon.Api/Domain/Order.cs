namespace BrikkhoRongon.Api.Domain;

/// <summary>Cancelled is deliberately last: "moving forward" (status++) can never reach it by accident.</summary>
public enum OrderStatus { Ordered, Packed, Shipped, OutForDelivery, Delivered, Cancelled }
public enum RequestType { Pot, GiftNote, Date, Custom }
public enum RequestStatus { Pending, Approved, Declined }

/// <summary>One customer order. Money fields are calculated on the server and never taken from the browser.</summary>
public class Order
{
    /// <summary>Public order number, e.g. BRK-7K2M9QXD. Long and random so it works as the guest's tracking key.</summary>
    public required string Id { get; set; }
    /// <summary>The signed-in customer, or null for a guest checkout.</summary>
    public string? UserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public OrderStatus Status { get; set; } = OrderStatus.Ordered;
    /// <summary>unpaid | paid | refunded. Empty on old rows, which count as unpaid.</summary>
    public string PaymentStatus { get; set; } = "unpaid";
    public string? CancelReason { get; set; }

    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; }
    public string? CouponCode { get; set; }
    public decimal Shipping { get; set; }
    public decimal Total { get; set; }

    public required string CustomerName { get; set; }
    public required string Phone { get; set; }
    public string Email { get; set; } = "";
    public required string District { get; set; }
    public required string Area { get; set; }
    public required string Address { get; set; }

    /// <summary>Delivery day as YYYY-MM-DD (a plain calendar day, so no timezone shifts).</summary>
    public required string DeliveryDate { get; set; }
    public required string Slot { get; set; }
    public required string Payment { get; set; }
    public required string GiftCard { get; set; }
    public string GiftNote { get; set; } = "";
    public string Note { get; set; } = "";

    public List<OrderLine> Lines { get; set; } = [];
    public List<OrderEvent> History { get; set; } = [];
    public List<ModRequest> Requests { get; set; } = [];
    public List<OrderNote> Notes { get; set; } = [];
}

/// <summary>A private note the shop team writes on an order. Customers never see these.</summary>
public class OrderNote
{
    public int Id { get; set; }
    public required string OrderId { get; set; }
    public required string Text { get; set; }
    public required string Author { get; set; }
    public DateTime At { get; set; } = DateTime.UtcNow;
}

/// <summary>A snapshot of what was bought, at the price paid. Later catalog changes never rewrite past orders.</summary>
public class OrderLine
{
    public int Id { get; set; }
    public required string OrderId { get; set; }
    public required string Slug { get; set; }
    public required string Name { get; set; }
    public required string ImageSrc { get; set; }
    public decimal UnitPrice { get; set; }
    public int Qty { get; set; }
}

/// <summary>One step in the order's timeline ("packed at 10:32").</summary>
public class OrderEvent
{
    public int Id { get; set; }
    public required string OrderId { get; set; }
    public OrderStatus Status { get; set; }
    public DateTime At { get; set; } = DateTime.UtcNow;
}

/// <summary>A customer's request to change an order before it ships (different pot, new date, gift note...).</summary>
public class ModRequest
{
    public required string Id { get; set; }
    public required string OrderId { get; set; }
    public RequestType Type { get; set; }
    public string Detail { get; set; } = "";
    public string? Value { get; set; }
    public RequestStatus Status { get; set; } = RequestStatus.Pending;
    public DateTime At { get; set; } = DateTime.UtcNow;
}
