using BrikkhoRongon.Api.Services;

namespace BrikkhoRongon.Api.Tests;

public class OrderIdsTests
{
    [Fact]
    public void Has_the_expected_shape_and_no_confusing_characters()
    {
        var id = OrderIds.New();
        Assert.StartsWith("BRK-", id);
        Assert.Equal(12, id.Length);
        Assert.DoesNotContain(id[4..], c => "01OIL".Contains(c) || char.IsLower(c));
    }

    [Fact]
    public void Ids_do_not_repeat()
        => Assert.Equal(2000, Enumerable.Range(0, 2000).Select(_ => OrderIds.New()).Distinct().Count());
}
