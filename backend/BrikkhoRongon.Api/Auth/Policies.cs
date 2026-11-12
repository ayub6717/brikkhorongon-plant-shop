using BrikkhoRongon.Api.Domain;
using Microsoft.AspNetCore.Authorization;

namespace BrikkhoRongon.Api.Auth;

/// <summary>
/// The permission table in one place. Endpoints just say which policy they need.
///   Read     look at the dashboard, products, customers, reports      (Owner, Manager, Viewer)
///   Write    change products, coupons, reviews, cancel/refund orders  (Owner, Manager)
///   Orders   see the order list and the delivery list                 (Owner, Manager, Viewer, Delivery)
///   Fulfil   move an order forward, mark paid, add a note             (Owner, Manager, Delivery)
///   Owner    settings, staff, customers' accounts, audit log          (Owner)
/// </summary>
public static class Policies
{
    public const string Read = "Read", Write = "Write", Orders = "Orders", Fulfil = "Fulfil", Owner = "Owner";

    public static void Add(AuthorizationOptions o)
    {
        o.AddPolicy(Read, p => p.RequireRole(Roles.Admin, Roles.Manager, Roles.Viewer));
        o.AddPolicy(Write, p => p.RequireRole(Roles.Admin, Roles.Manager));
        o.AddPolicy(Orders, p => p.RequireRole(Roles.Admin, Roles.Manager, Roles.Viewer, Roles.Delivery));
        o.AddPolicy(Fulfil, p => p.RequireRole(Roles.Admin, Roles.Manager, Roles.Delivery));
        o.AddPolicy(Owner, p => p.RequireRole(Roles.Admin));
    }
}
