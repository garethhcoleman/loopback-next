// Copyright IBM Corp. 2020. All Rights Reserved.
// Node module: @loopback/rest
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {BindingKey, Context} from '@loopback/core';
import {expect} from '@loopback/testlab';
import {Ajv} from 'ajv';
import {RestBindings} from '../..';
import {AjvProvider} from '../../validation/ajv.service';

describe('Ajv service', () => {
  const AJV_SERVICE = BindingKey.create<Ajv>('services.Ajv');
  let ctx: Context;

  beforeEach(givenContext);

  it('allows binary format by default', async () => {
    const ajv = await ctx.get(AJV_SERVICE);
    const validator = ajv.compile({type: 'string', format: 'binary'});
    const result = await validator('ABC123');
    expect(result).to.be.true();
  });

  it('honors request body parser options', async () => {
    ctx
      .bind(RestBindings.REQUEST_BODY_PARSER_OPTIONS)
      .to({validation: {unknownFormats: ['gmail']}});
    const ajv = await ctx.get(AJV_SERVICE);
    const validator = ajv.compile({type: 'string', format: 'gmail'});
    const result = await validator('example@gmail.com');
    expect(result).to.be.true();
  });

  it('accepts request body parser options via constructor', async () => {
    const ajv = new AjvProvider({unknownFormats: ['gmail']}).value();
    const validator = ajv.compile({type: 'string', format: 'gmail'});
    const result = await validator('example@gmail.com');
    expect(result).to.be.true();
  });

  // possible values for type any
  const TEST_VALUES = {
    string: 'abc',
    number: 123,
    object: {random: 'random'},
    array: [1, 2, 3],
  };

  context('accepts any type', () => {
    for (const v in TEST_VALUES) {
      testAnyTypeWith(v);
    }

    function testAnyTypeWith(value: string) {
      it(`with value ${value}`, async () => {
        const ajv = new AjvProvider().value();
        const validator = ajv.compile({});
        const result = await validator(value);
        expect(result).to.be.true();
      });
    }
  });

  context('accepts any type - property', () => {
    for (const v in TEST_VALUES) {
      testAnyTypeWith(v);
    }

    function testAnyTypeWith(value: string) {
      it(`with value ${value}`, async () => {
        const ajv = new AjvProvider().value();
        const validator = ajv.compile({
          type: 'object',
          properties: {
            name: {type: 'string'},
            arbitraryProp: {},
          },
        });
        const result = await validator({
          name: 'Zoe',
          arbitraryProp: value,
        });
        expect(result).to.be.true();
      });
    }
  });

  it('reports unknown format', async () => {
    const ajv = await ctx.get(AJV_SERVICE);
    expect(() => ajv.compile({type: 'string', format: 'gmail'})).to.throw(
      /unknown format "gmail" is used in schema/,
    );
  });

  function givenContext() {
    ctx = new Context();
    ctx.bind(AJV_SERVICE).toProvider(AjvProvider);
  }
});
