import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { ExampleHomebridgePlatform } from './platform';

import noble from '@abandonware/noble';
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class TP357 {
  private tempService: Service;
  private humidService: Service;

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
  private exampleStates = {
    Temperature: 0,
    Humidity: 0.0,
  };

  constructor(
    private readonly platform: ExampleHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'ThermPro')
      .setCharacteristic(this.platform.Characteristic.Model, 'TP357')
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        'Default-Serial',
      );

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.tempService =
      this.accessory.getService(this.platform.Service.TemperatureSensor) ||
      this.accessory.addService(this.platform.Service.TemperatureSensor);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.tempService.setCharacteristic(
      this.platform.Characteristic.Name,
      accessory.context.device.exampleDisplayName);

    this.humidService =
      this.accessory.getService(this.platform.Service.HumiditySensor) ||
      this.accessory.addService(this.platform.Service.HumiditySensor);

    this.humidService.setCharacteristic(
      this.platform.Characteristic.Name,
      accessory.context.device.exampleDisplayName,
    );

    noble.on('stateChange', async (state) => {
      if (state === 'poweredOn') {
        await noble.startScanning([], false);
      }
    });

    noble.on('discover', async (peripheral) => {
      this.platform.log.debug(
        `Found ${peripheral.id} - ${peripheral.advertisement.localName}`,
      );

      if (peripheral.id === '107636c1f5b0') {
        this.platform.log.debug(
          `### Found ${peripheral.advertisement.localName}`,
        );

        await noble.stopScanningAsync();
        this.platform.log.debug('Stopped scanning');

        await peripheral.connectAsync();
        this.platform.log.debug('Connected');

        const { characteristics } =
          await peripheral.discoverSomeServicesAndCharacteristicsAsync([], []);

        characteristics.map((c) => {
          if (c.uuid === '000102030405060708090a0b0c0d2b10') {
            c.on('data', (data, isNotification) => {
              const temp = data.readUInt16LE(3) / 10.0;
              const humid = data.readUInt8(5);

              this.platform.log.debug(`${humid}%,${temp}°C`);

              this.tempService.updateCharacteristic(
                this.platform.Characteristic.CurrentTemperature,
                temp,
              );

              this.humidService.updateCharacteristic(this.platform.Characteristic.CurrentRelativeHumidity, humid);
            });

            c.subscribeAsync();
            this.platform.log.debug('subscribed');
          }
        });
      }
    });
    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // this.service
    //   .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
    //   .onGet(this.handleCurrentTemperatureGet.bind(this));

    // register handlers for the On/Off Characteristic
    // this.service.getCharacteristic(this.platform.Characteristic.On)
    //   .onSet(this.setOn.bind(this))                // SET - bind to the `setOn` method below
    //   .onGet(this.getOn.bind(this));               // GET - bind to the `getOn` method below

    // register handlers for the Brightness Characteristic
    // this.service.getCharacteristic(this.platform.Characteristic.Brightness)
    //   .onSet(this.setBrightness.bind(this));       // SET - bind to the 'setBrightness` method below

    /**
     * Creating multiple services of the same type.
     *
     * To avoid "Cannot add a Service with the same UUID another Service without also defining a unique 'subtype' property." error,
     * when creating multiple services of the same type, you need to use the following syntax to specify a name and subtype id:
     * this.accessory.getService('NAME') || this.accessory.addService(this.platform.Service.Lightbulb, 'NAME', 'USER_DEFINED_SUBTYPE_ID');
     *
     * The USER_DEFINED_SUBTYPE must be unique to the platform accessory (if you platform exposes multiple accessories, each accessory
     * can use the same sub type id.)
     */

    // Example: add two "motion sensor" services to the accessory
    // const motionSensorOneService = this.accessory.getService('Motion Sensor One Name') ||
    //   this.accessory.addService(this.platform.Service.MotionSensor, 'Motion Sensor One Name', 'YourUniqueIdentifier-1');

    // const motionSensorTwoService = this.accessory.getService('Motion Sensor Two Name') ||
    //   this.accessory.addService(this.platform.Service.MotionSensor, 'Motion Sensor Two Name', 'YourUniqueIdentifier-2');

    // const sensorService = this.accessory.getService('Temperature') ||
    /**
     * Updating characteristics values asynchronously.
     *
     * Example showing how to update the state of a Characteristic asynchronously instead
     * of using the `on('get')` handlers.
     * Here we change update the motion sensor trigger states on and off every 10 seconds
     * the `updateCharacteristic` method.
     *
     */
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  // async setOn(value: CharacteristicValue) {
  //   // implement your own code to turn your device on/off
  //   this.exampleStates.On = value as boolean;

  //   this.platform.log.debug('Set Characteristic On ->', value);
  // }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  // async getOn(): Promise<CharacteristicValue> {
  //   // implement your own code to check if the device is on
  //   const isOn = this.exampleStates.On;

  //   this.platform.log.debug('Get Characteristic On ->', isOn);

  //   // if you need to return an error to show the device as "Not Responding" in the Home app:
  //   // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

  //   return isOn;
  // }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, changing the Brightness
   */
  // async setBrightness(value: CharacteristicValue) {
  //   // implement your own code to set the brightness
  //   this.exampleStates.Brightness = value as number;

  //   this.platform.log.debug('Set Characteristic Brightness -> ', value);
  // }

}
