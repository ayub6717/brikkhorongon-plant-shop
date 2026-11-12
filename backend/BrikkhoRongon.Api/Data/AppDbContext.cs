using BrikkhoRongon.Api.Domain;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace BrikkhoRongon.Api.Data;

// IdentityDbContext adds the user/role tables (AspNetUsers, AspNetRoles, ...) on top of our own tables.
public class AppDbContext(DbContextOptions<AppDbContext> options) : IdentityDbContext<AppUser>(options)
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Address> Addresses => Set<Address>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderLine> OrderLines => Set<OrderLine>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<OrderNote> OrderNotes => Set<OrderNote>();
    public DbSet<PromoCode> PromoCodes => Set<PromoCode>();
    public DbSet<ShopSettings> Settings => Set<ShopSettings>();
    public DbSet<AuditEntry> AuditLog => Set<AuditEntry>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<PasswordReset> PasswordResets => Set<PasswordReset>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b); // required: configures the Identity tables

        b.Entity<AppUser>(e => e.Property(u => u.FullName).HasMaxLength(80));

        b.Entity<Address>(e =>
        {
            e.ToTable("addresses");
            e.HasIndex(a => a.UserId);
            e.Property(a => a.Label).HasMaxLength(30);
            e.Property(a => a.District).HasMaxLength(20);
            e.Property(a => a.Area).HasMaxLength(100);
            e.Property(a => a.Line).HasMaxLength(200);
            // Deleting a user deletes their addresses too.
            e.HasOne<AppUser>().WithMany().HasForeignKey(a => a.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Order>(e =>
        {
            e.ToTable("orders");
            e.HasKey(o => o.Id);
            e.Property(o => o.Id).HasMaxLength(20);
            e.HasIndex(o => o.UserId);
            e.HasIndex(o => o.CreatedAt);
            e.Property(o => o.Status).HasConversion<string>().HasMaxLength(20);
            foreach (var money in new[] { nameof(Order.Subtotal), nameof(Order.Discount), nameof(Order.Shipping), nameof(Order.Total) })
                e.Property(money).HasPrecision(12, 2);
            e.Property(o => o.CouponCode).HasMaxLength(30);
            e.Property(o => o.PaymentStatus).HasMaxLength(20);
            e.Property(o => o.CancelReason).HasMaxLength(200);
            e.HasIndex(o => o.DeliveryDate);
            e.HasMany(o => o.Notes).WithOne().HasForeignKey(n => n.OrderId).OnDelete(DeleteBehavior.Cascade);
            e.Property(o => o.CustomerName).HasMaxLength(80);
            e.Property(o => o.Phone).HasMaxLength(20);
            e.Property(o => o.Email).HasMaxLength(254);
            e.Property(o => o.District).HasMaxLength(20);
            e.Property(o => o.Area).HasMaxLength(100);
            e.Property(o => o.Address).HasMaxLength(200);
            e.Property(o => o.DeliveryDate).HasMaxLength(10);
            e.Property(o => o.Slot).HasMaxLength(20);
            e.Property(o => o.Payment).HasMaxLength(20);
            e.Property(o => o.GiftCard).HasMaxLength(20);
            e.Property(o => o.GiftNote).HasMaxLength(200);
            e.Property(o => o.Note).HasMaxLength(300);
            // A deleted account keeps its orders (the shop still has to fulfil and account for them).
            e.HasOne<AppUser>().WithMany().HasForeignKey(o => o.UserId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
            e.HasMany(o => o.Lines).WithOne().HasForeignKey(l => l.OrderId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(o => o.History).WithOne().HasForeignKey(h => h.OrderId).OnDelete(DeleteBehavior.Cascade);
            e.HasMany(o => o.Requests).WithOne().HasForeignKey(r => r.OrderId).OnDelete(DeleteBehavior.Cascade);
        });
        b.Entity<OrderLine>(e =>
        {
            e.ToTable("order_lines");
            e.Property(l => l.Slug).HasMaxLength(100);
            e.Property(l => l.Name).HasMaxLength(150);
            e.Property(l => l.ImageSrc).HasMaxLength(500);
            e.Property(l => l.UnitPrice).HasPrecision(12, 2);
        });
        b.Entity<OrderEvent>(e =>
        {
            e.ToTable("order_events");
            e.Property(h => h.Status).HasConversion<string>().HasMaxLength(20);
        });
        b.Entity<ModRequest>(e =>
        {
            e.ToTable("order_requests");
            e.HasKey(r => r.Id);
            e.Property(r => r.Id).HasMaxLength(20);
            e.Property(r => r.Type).HasConversion<string>().HasMaxLength(20);
            e.Property(r => r.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(r => r.Detail).HasMaxLength(300);
            e.Property(r => r.Value).HasMaxLength(200);
        });

        b.Entity<OrderNote>(e =>
        {
            e.ToTable("order_notes");
            e.Property(n => n.Text).HasMaxLength(500);
            e.Property(n => n.Author).HasMaxLength(80);
        });

        b.Entity<PromoCode>(e =>
        {
            e.ToTable("promo_codes");
            e.HasKey(c => c.Code);
            e.Property(c => c.Code).HasMaxLength(30);
            e.Property(c => c.Kind).HasMaxLength(10);
        });

        b.Entity<ShopSettings>(e =>
        {
            e.ToTable("shop_settings");
            e.Property(x => x.Id).ValueGeneratedNever();
            e.Property(x => x.FreeShippingThreshold).HasPrecision(12, 2);
            e.Property(x => x.DhakaInnerFee).HasPrecision(12, 2);
            e.Property(x => x.DhakaOuterFee).HasPrecision(12, 2);
            e.Property(x => x.Slots).HasMaxLength(80);
            e.Property(x => x.ShopName).HasMaxLength(80);
            e.Property(x => x.Phone).HasMaxLength(30);
            e.Property(x => x.Email).HasMaxLength(254);
            e.Property(x => x.Address).HasMaxLength(200);
            // A small dictionary kept in one text column as JSON.
            e.Property(x => x.DistrictFees).HasConversion(
                v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                v => System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, decimal>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new())
                .HasColumnType("text")
                .Metadata.SetValueComparer(new Microsoft.EntityFrameworkCore.ChangeTracking.ValueComparer<Dictionary<string, decimal>>(
                    (a, c) => a != null && c != null && a.Count == c.Count && !a.Except(c).Any(),
                    v => v.Aggregate(0, (h, kv) => HashCode.Combine(h, kv.Key, kv.Value)),
                    v => new Dictionary<string, decimal>(v)));
        });

        b.Entity<PasswordReset>(e =>
        {
            e.ToTable("password_resets");
            e.HasIndex(r => r.TokenHash).IsUnique();
            e.HasIndex(r => r.UserId);
            e.Property(r => r.UserId).HasMaxLength(450);
            e.Property(r => r.TokenHash).HasMaxLength(64);
        });

        b.Entity<Notification>(e =>
        {
            e.ToTable("notifications");
            e.HasIndex(n => new { n.UserId, n.CreatedAt });
            e.Property(n => n.UserId).HasMaxLength(450);
            e.Property(n => n.Kind).HasMaxLength(40);
            e.Property(n => n.OrderId).HasMaxLength(40);
        });

        b.Entity<AuditEntry>(e =>
        {
            e.ToTable("audit_log");
            e.HasIndex(a => a.At);
            e.Property(a => a.ActorId).HasMaxLength(450);
            e.Property(a => a.ActorEmail).HasMaxLength(254);
            e.Property(a => a.Action).HasMaxLength(60);
            e.Property(a => a.Entity).HasMaxLength(40);
            e.Property(a => a.EntityId).HasMaxLength(100);
            e.Property(a => a.Detail).HasMaxLength(1000);
        });

        b.Entity<ProductImage>(e =>
        {
            e.ToTable("product_images");
            e.Property(i => i.ContentType).HasMaxLength(30);
        });

        b.Entity<Review>(e =>
        {
            e.ToTable("reviews");
            e.HasIndex(r => r.Slug);
            e.HasIndex(r => new { r.UserId, r.Slug }).IsUnique(); // one review per customer per plant
            e.Property(r => r.Slug).HasMaxLength(100);
            e.Property(r => r.AuthorName).HasMaxLength(80);
            e.Property(r => r.Title).HasMaxLength(80);
            e.Property(r => r.Text).HasMaxLength(600);
            e.HasOne<AppUser>().WithMany().HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Product>(e =>
        {
            e.ToTable("products");
            // Ids come from the catalog itself (they match the storefront), not from the database.
            e.Property(p => p.Id).ValueGeneratedNever();
            e.HasIndex(p => p.Slug).IsUnique();
            e.HasIndex(p => p.Category);
            e.Property(p => p.Slug).HasMaxLength(100);
            e.Property(p => p.NameEn).HasMaxLength(150);
            e.Property(p => p.NameBn).HasMaxLength(150);
            e.Property(p => p.Price).HasPrecision(12, 2);
            // Enums are stored as readable text ("Bonsai"), so the table makes sense when you open it.
            e.Property(p => p.Category).HasConversion<string>().HasMaxLength(20);
            e.Property(p => p.Light).HasConversion<string>().HasMaxLength(20);
            e.Property(p => p.Water).HasConversion<string>().HasMaxLength(20);
            e.Property(p => p.Difficulty).HasConversion<string>().HasMaxLength(20);
            e.Property(p => p.BonsaiStyle).HasConversion<string>().HasMaxLength(20);
            e.Property(p => p.BonsaiPlacement).HasConversion<string>().HasMaxLength(20);
        });
    }
}
