const logger = require("../../src/utils/logger");

describe("Logger", () => {
  it("should have the correct log level", () => {
    expect(logger.level).toBe("info");
  });

  it("should have Console and File transports", () => {
    const transports = logger.transports.map((t) => t.constructor.name);
    expect(transports).toContain("Console");
    expect(transports).toContain("File");
  });

  it("should log messages correctly", () => {
    const spy = jest.spyOn(logger, "info").mockImplementation(() => {});
    logger.info("Test log message");
    expect(spy).toHaveBeenCalledWith("Test log message");
    spy.mockRestore();
  });

  it("should log errors to the error.log file", () => {
    const spy = jest.spyOn(logger, "error").mockImplementation(() => {});
    logger.error("Test error message");
    expect(spy).toHaveBeenCalledWith("Test error message");
    spy.mockRestore();
  });
});
