using BrikkhoRongon.Api.Services;

namespace BrikkhoRongon.Api.Tests;

/// <summary>The server decides what an order costs, so these rules are the ones worth protecting.</summary>
public class PricingTests
{
    [Theory]
    [InlineData(0, "dhaka", "", 0)]            // empty cart: nothing to ship
    [InlineData(3000, "dhaka", "", 0)]         // free delivery from 3000
    [InlineData(2999, "dhaka", "", 60)]
    [InlineData(1000, "dhaka", "Dhanmondi", 60)]
    [InlineData(1000, "dhaka", "ধানমন্ডি", 60)] // Bangla area names count too
    [InlineData(1000, "dhaka", "Savar", 100)]  // outside the inner-city list
    [InlineData(1000, "chattogram", "", 120)]
    [InlineData(1000, "sylhet", "", 130)]
    [InlineData(1000, "somewhere-else", "", 150)] // unknown districts fall back to "other"
    public void Shipping_follows_the_district_table(decimal subtotal, string district, string area, decimal expected)
        => Assert.Equal(expected, Pricing.Shipping(subtotal, district, area));

    [Fact]
    public void Percent_coupon_takes_ten_percent()
    {
        var t = Pricing.Compute(1000, "WELCOME10", "dhaka", "");
        Assert.Equal("WELCOME10", t.CouponCode);
        Assert.Equal(100, t.Discount);
        Assert.Equal(60, t.Shipping);   // 900 is still under the free-shipping line
        Assert.Equal(960, t.Total);
    }

    [Fact]
    public void Percent_rounds_half_up()
        => Assert.Equal(51, Pricing.Compute(505, "WELCOME10", "dhaka", "").Discount); // 50.5 -> 51

    [Fact]
    public void Coupon_codes_ignore_case_and_spaces()
        => Assert.Equal("WELCOME10", Pricing.Compute(1000, "  welcome10 ", "dhaka", "").CouponCode);

    [Fact]
    public void Unknown_coupon_is_reported_and_not_applied()
    {
        var t = Pricing.Compute(1000, "NOPE", "dhaka", "");
        Assert.Equal("COUPON_UNKNOWN", t.CouponProblem);
        Assert.Null(t.CouponCode);
        Assert.Equal(0, t.Discount);
    }

    [Fact]
    public void Coupon_below_its_minimum_is_reported()
    {
        var t = Pricing.Compute(400, "WELCOME10", "dhaka", "");
        Assert.Equal("COUPON_MIN", t.CouponProblem);
        Assert.Equal(0, t.Discount);
    }

    [Fact]
    public void Free_ship_coupon_removes_shipping()
    {
        var t = Pricing.Compute(1000, "FREESHIP", "chattogram", "");
        Assert.Equal(0, t.Shipping);
        Assert.Equal(1000, t.Total);
    }

    [Fact]
    public void Worked_example_from_the_storefront_checkout()
    {
        // 3070 subtotal, PLANT100 takes 100 off, 2970 is under 3000 so Dhaka delivery is 60.
        var t = Pricing.Compute(3070, "PLANT100", "dhaka", "");
        Assert.Equal(100, t.Discount);
        Assert.Equal(60, t.Shipping);
        Assert.Equal(3030, t.Total);
    }

    [Fact]
    public void Discount_never_exceeds_the_subtotal()
    {
        foreach (var code in new[] { "WELCOME10", "PLANT100", "FREESHIP" })
            foreach (var subtotal in new decimal[] { 500, 1500, 5000 })
            {
                var t = Pricing.Compute(subtotal, code, "dhaka", "");
                Assert.InRange(t.Discount, 0, subtotal);
                Assert.True(t.Total >= 0);
            }
    }
}
