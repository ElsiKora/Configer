export default {
  '*': (files) => {
    const commands = ['prettier --write --ignore-unknown'];

    const eslintFiles = files.filter((file) => {
      const validExtensions = [
        'js',
        'jsx',
        'mjs',
        'cjs',
        'ts',
        'tsx',
        'json',
        'jsonc',
        'yml',
        'yaml',
      ];
      const fileExtension = file.split('.').pop();

      return Boolean(fileExtension && validExtensions.includes(fileExtension));
    });

    if (eslintFiles.length > 0) {
      commands.push(`eslint --fix --max-warnings=0 --no-warn-ignored ${eslintFiles.join(' ')}`);
    }

    return commands;
  },
};
