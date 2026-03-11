const fs = require('fs');
const filesStructure = require('../../utils/files');

jest.mock('fs');

describe('filesStructure', () => {
  it('returns structure of markdown files in directory and only select .md files', () => {
    // file1.md
    // file2.md
    // subdir/
    //   file3.md
    //   image.png
    // subdir_only_image/
    //   image2.png
    const mockFiles = ['file1.md', 'file2.md', 'subdir/file3.md', 'subdir/image.png', 'subdir_only_image/image2.png'];
    fs.statSync.mockImplementation((file) => {
      return { isDirectory: () => !file.includes('.') };
    });

    fs.readdirSync.mockReturnValue(mockFiles);

    const result = filesStructure('root');

    expect(result).toEqual([['file1.md'], ['file2.md'], ['subdir', 'file3.md']]);
  });

  it('returns empty array when directory is empty', () => {
    fs.statSync.mockReturnValue({ isDirectory: () => true });
    fs.readdirSync.mockReturnValue([]);

    const result = filesStructure('root');

    expect(result).toEqual([]);
  });
});
