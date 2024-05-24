const fs = jest.createMockFromModule("fs");

(fs as any).promises = {
  access: jest.fn(),
};

module.exports = fs;
