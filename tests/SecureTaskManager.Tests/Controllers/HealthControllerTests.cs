using Xunit;
using Microsoft.AspNetCore.Mvc;
using SecureTaskManager.API.Controllers;

namespace SecureTaskManager.Tests.Controllers;

public class HealthControllerTests
{
    [Fact]
    public void GetHealth_ReturnsOkResult()
    {
        // Arrange
        var controller = new HealthController();

        // Act
        var result = controller.GetHealth();

        // Assert
        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public void GetHealth_ReturnsHealthStatus()
    {
        // Arrange
        var controller = new HealthController();

        // Act
        var result = controller.GetHealth() as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        Assert.NotNull(result.Value);
    }
}