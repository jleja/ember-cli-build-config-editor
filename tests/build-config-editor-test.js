var EmberBuildConfigEditor = require('../index.js');
var expect = require('chai').expect;
var fs = require('fs');
var astEquality = require('./helpers/esprima-ast-equality.js');

function readFixture(name) {
  return fs.readFileSync('./tests/fixtures/' + name, 'utf-8');
}

describe('Initialization', function () {
  it('parses', function () {
    var source = readFixture('default.js');

    var build = new EmberBuildConfigEditor(source);

    expect(build).to.exist;
    expect(build.source).to.exist;
    expect(build.ast).to.exist;
    expect(build.configNode).to.exist;
    expect(build.configNode.type).to.equal('ObjectExpression');
  });
});

describe('Adds inline configuration', function () {
  it('changes nothing if no key is supplied', function () {
    var source = readFixture('default.js');

    var build = new EmberBuildConfigEditor(source);

    var newBuild = build.edit(undefined, {});

    astEquality(newBuild.code(), source);
  });

  it('changes nothing if no configuration object is supplied', function () {
    var source = readFixture('default.js');

    var build = new EmberBuildConfigEditor(source);

    var newBuild = build.edit('some-addon', undefined);

    astEquality(newBuild.code(), source);
  });

  it('adds an empty configuration if an empty configuration is supplied', function () {
    var source = readFixture('default.js');

    var build = new EmberBuildConfigEditor(source);

    var newBuild = build.edit('some-addon', {});

    astEquality(newBuild.code(), readFixture('empty-config-block.js'));
  });

  it('does not duplicate an existing key', function () {
    var source = readFixture('empty-config-block.js');

    var build = new EmberBuildConfigEditor(source);

    var newBuild = build.edit('some-addon', {});

    astEquality(newBuild.code(), source);
  });

  it('adds a key with properties to an empty configuration', function () {
    var source = readFixture('default.js');

    var build = new EmberBuildConfigEditor(source);

    var newBuild = build.edit('some-addon', {
      booleanProperty: false,
      numericProperty: 17,
      stringProperty: 'wow'
    });

    astEquality(newBuild.code(), readFixture('single-config-block-identifier-keys.js'));
  });

  it('changes the values of existing configuration properties', function () {
    var source = readFixture('single-config-block-different-values.js');

    var build = new EmberBuildConfigEditor(source);

    var newBuild = build.edit('some-addon', {
      booleanProperty: false,
      numericProperty: 17,
      stringProperty: 'wow'
    });

    astEquality(newBuild.code(), readFixture('single-config-block-literal-keys.js'));
  });

  it('recognizes unquoted properties as matching', function () {
    var source = readFixture('single-config-block-unquoted-properties.js');

    var build = new EmberBuildConfigEditor(source);

    var newBuild = build.edit('some-addon', {
      booleanProperty: false,
      numericProperty: 17,
      stringProperty: 'wow'
    });

    astEquality(newBuild.code(), source);
  });

  it('recognizes an unquoted key as matching', function () {
    var source = readFixture('single-config-block-unquoted-key.js');

    var build = new EmberBuildConfigEditor(source);

    var newBuild = build.edit('someaddon', {
      booleanProperty: false,
      numericProperty: 17,
      stringProperty: 'wow'
    });

    astEquality(newBuild.code(), source);
  });

  it('adds a key with properties to an empty addon configuration', function () {
    var source = readFixture('default-addon.js');

    var build = new EmberBuildConfigEditor(source);

    var newBuild = build.edit('some-addon', {
      booleanProperty: false,
      numericProperty: 17,
      stringProperty: 'wow'
    });

    astEquality(newBuild.code(), readFixture('single-config-block-addon.js'));
  });

  it('uses identifiers when possible and literals otherwise for property keys', function() {
    var source = readFixture('empty-config-block.js');

    var build = new EmberBuildConfigEditor(source);

    var newBuild = build.edit('some-addon', {
      booleanProperty: false,
      'numeric-property': 17,
      'stringProperty': 'wow'
    });

    astEquality(newBuild.code(), readFixture('single-config-block-mixed.js'));
  });
});

describe('Adds separate configuration', function() {
  it('edits a non-inline config', function() {
    var source = readFixture('separate-config-block.js');

    var build = new EmberBuildConfigEditor(source);

    var newBuild = build.edit('some-addon', {
      booleanProperty: true,
      numericProperty: 42,
      stringProperty: 'amazing'
    });

    astEquality(newBuild.code(), readFixture('separate-config-block-different-values.js'));
  });

  it('edits a non-inline config in an addon configuration', function() {
    var source = readFixture('separate-config-block-addon.js');

    var build = new EmberBuildConfigEditor(source);

    var newBuild = build.edit('some-addon', {
      booleanProperty: true,
      numericProperty: 42,
      stringProperty: 'amazing'
    });

    astEquality(newBuild.code(), readFixture('separate-config-block-different-values-addon.js'));
  });
});

describe('Handles missing configuration', function() {
  it('throws an error when the configuration cannot be found', function() {
    var source = readFixture('missing-config-block.js');

    var build = new EmberBuildConfigEditor(source);

    expect(function() {
      build.edit('some-addon', {
        booleanProperty: true,
        numericProperty: 42,
        stringProperty: 'amazing'
      });
    }).to.throw('Configuration object could not be found');
  });
});

describe('Retrieves configuration', function () {
  describe('Inline confugration', function() {
    it('returns undefined if the key is not present', function () {
      var source = readFixture('default.js');

      var build = new EmberBuildConfigEditor(source);

      var config = build.retrieve('some-addon');

      expect(config).to.be.undefined;
    });

    it('returns an empty object when there is an empty config block', function () {
      var source = readFixture('empty-config-block.js');

      var build = new EmberBuildConfigEditor(source);

      var config = build.retrieve('some-addon');

      expect(config).to.exist;
      expect(Object.keys(config)).to.have.lengthOf(0);
    });

    it('returns the values in the config when present', function () {
      var source = readFixture('single-config-block-literal-keys.js');

      var build = new EmberBuildConfigEditor(source);

      var config = build.retrieve('some-addon');

      expect(config).to.exist;
      expect(config.booleanProperty).to.exist;
      expect(config.booleanProperty).to.be.false;
      expect(config.numericProperty).to.exist;
      expect(config.numericProperty).to.equal(17);
      expect(config.stringProperty).to.exist;
      expect(config.stringProperty).to.equal('wow');
    });
  });

  describe('Separate configuration', function() {
    it('returns the values from a separate config when present', function() {
      var source = readFixture('separate-config-block.js');

      var build = new EmberBuildConfigEditor(source);

      var config = build.retrieve('some-addon');

      expect(config).to.exist;
      expect(config.booleanProperty).to.exist;
      expect(config.booleanProperty).to.be.false;
      expect(config.numericProperty).to.exist;
      expect(config.numericProperty).to.equal(17);
      expect(config.stringProperty).to.exist;
      expect(config.stringProperty).to.equal('wow');
    });
  });

  it('returns undefined if the configuration cannot be found', function() {
    var source = readFixture('missing-config-block.js');

    var build = new EmberBuildConfigEditor(source);

    var config = build.retrieve('some-addon');

    expect(config).to.be.undefined;
  });
});
