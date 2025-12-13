import type * as types from './types';
import type { ConfigOptions, FetchResponse } from 'api/dist/core'
import Oas from 'oas';
import APICore from 'api/dist/core';
import definition from './openapi.json';

class SDK {
  spec: Oas;
  core: APICore;

  constructor() {
    this.spec = Oas.init(definition);
    this.core = new APICore(this.spec, 'regridsupport/2.0.0 (api/6.1.3)');
  }

  /**
   * Optionally configure various options that the SDK allows.
   *
   * @param config Object of supported SDK options and toggles.
   * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
   * should be represented in milliseconds.
   */
  config(config: ConfigOptions) {
    this.core.setConfig(config);
  }

  /**
   * If the API you're using requires authentication you can supply the required credentials
   * through this method and the library will magically determine how they should be used
   * within your API request.
   *
   * With the exception of OpenID and MutualTLS, it supports all forms of authentication
   * supported by the OpenAPI specification.
   *
   * @example <caption>HTTP Basic auth</caption>
   * sdk.auth('username', 'password');
   *
   * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
   * sdk.auth('myBearerToken');
   *
   * @example <caption>API Keys</caption>
   * sdk.auth('myApiKey');
   *
   * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
   * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
   * @param values Your auth credentials for the API; can specify up to two strings or numbers.
   */
  auth(...values: string[] | number[]) {
    this.core.setAuth(...values);
    return this;
  }

  /**
   * If the API you're using offers alternate server URLs, and server variables, you can tell
   * the SDK which one to use with this method. To use it you can supply either one of the
   * server URLs that are contained within the OpenAPI definition (along with any server
   * variables), or you can pass it a fully qualified URL to use (that may or may not exist
   * within the OpenAPI definition).
   *
   * @example <caption>Server URL with server variables</caption>
   * sdk.server('https://{region}.api.example.com/{basePath}', {
   *   name: 'eu',
   *   basePath: 'v14',
   * });
   *
   * @example <caption>Fully qualified server URL</caption>
   * sdk.server('https://eu.api.example.com/v14');
   *
   * @param url Server URL
   * @param variables An object of variables to replace into the server URL.
   */
  server(url: string, variables = {}) {
    this.core.setServer(url, variables);
  }

  /**
   * This endpoint delivers parcels using latitude and longitude points. You can add a radius
   * zone to the point or points and limit the amount of parcels returned in the response.
   * Parameter 'geojson' takes priority if Lat/Lon is used in same request. This endpoint
   * allows access to test all of our premium matched datasets. **Attention API Trial Token
   * Users:** Data is restricted to 7 counties. Please only use data from one of the
   * restricted counties.
   *
   * @summary Point - Latitude and Longitude
   * @throws FetchError<401, types.GetParcelsPointResponse401> Unauthorized
   */
  getParcelsPoint(metadata?: types.GetParcelsPointMetadataParam): Promise<FetchResponse<200, types.GetParcelsPointResponse200>> {
    return this.core.fetch('/parcels/point', 'get', metadata);
  }

  /**
   * This endpoint delivers parcels using latitude and longitude points. You can add a radius
   * zone to the point or points and limit the amount of parcels returned in the response.
   * Parameter 'geojson' takes priority if Lat/Lon is used in same request. This endpoint
   * allows access to test all of our premium matched datasets. **Attention API Trial Token
   * Users:** Data is restricted to 7 counties. Please only use data from one of the
   * restricted counties.
   *
   * @summary Point - Latitude and Longitude
   * @throws FetchError<401, types.PostParcelsPointResponse401> Unauthorized
   */
  postParcelsPoint(body: types.PostParcelsPointBodyParam, metadata?: types.PostParcelsPointMetadataParam): Promise<FetchResponse<200, types.PostParcelsPointResponse200>> {
    return this.core.fetch('/parcels/point', 'post', body, metadata);
  }

  /**
   * This endpoint delivers parcels using an address within the United States and Puerto
   * Rico. There can be multiple locations within the United States and Puerto Rico with
   * similar addresses and therefore we suggest specifying the location within a State,
   * County and/or City by using the `path` parameter.
   *
   * @summary Address Search
   * @throws FetchError<401, types.GetParcelsAddressResponse401> Unauthorized
   */
  getParcelsAddress(metadata: types.GetParcelsAddressMetadataParam): Promise<FetchResponse<200, types.GetParcelsAddressResponse200>> {
    return this.core.fetch('/parcels/address', 'get', metadata);
  }

  /**
   * This endpoint delivers parcels using the Assessor Parcel Number (APN) which is assigned
   * to each parcel by the respective county. Multiple parcels can be returned depending on
   * the APN, therefore specify the location within a State, County and/or City by using the
   * parameter `path`. **Attention API Trial Token Users:** Data is restricted to 7 counties.
   * Please only use data from one of the restricted counties.
   *
   * @summary Assessor Parcel Number (APN) Search
   * @throws FetchError<401, types.GetParcelsApnResponse401> Unauthorized
   */
  getParcelsApn(metadata: types.GetParcelsApnMetadataParam): Promise<FetchResponse<200, types.GetParcelsApnResponse200>> {
    return this.core.fetch('/parcels/apn', 'get', metadata);
  }

  /**
   * This endpoint delivers parcels using the owner name, either an individual or entity.
   * Multiple parcels can be returned so limit  the response by using parameter `limit` and
   * specify the location within a State, County and/or City using the parameter `path`. 
   * This endpoint allows access to test all of our premium matched datasets.
   *
   * @summary Owner Name Search
   * @throws FetchError<401, types.GetParcelsOwnerResponse401> Unauthorized
   */
  getParcelsOwner(metadata: types.GetParcelsOwnerMetadataParam): Promise<FetchResponse<200, types.GetParcelsOwnerResponse200>> {
    return this.core.fetch('/parcels/owner', 'get', metadata);
  }

  /**
   * In addition to the primary identifiers in our dataset, our API is also queryable at a
   * nationwide level using a subset of our 120+ schema fields that have been optimized for
   * queries at scale. The following is the general form for this endpoint. See additional
   * query endpoints for examples on each field type. Multiple fields can be used in a single
   * query (up to 4), to refine results. [<i>See full list of
   * fields</i>](https://support.regrid.com/articles/using-the-api/#query-by-additional-parcel-data-fields).
   * See full list of fields. Check out Sample Use Case Scenarios in this section. This
   * endpoint allows access to test all of our premium matched datasets.
   *
   * @summary Overview
   * @throws FetchError<400, types.GetParcelsQueryResponse400> Invalid requests return informative 400 error
   * @throws FetchError<401, types.GetParcelsQueryResponse401> Unauthorized
   */
  getParcelsQuery(metadata?: types.GetParcelsQueryMetadataParam): Promise<FetchResponse<200, types.GetParcelsQueryResponse200>> {
    return this.core.fetch('/parcels/query', 'get', metadata);
  }

  /**
   * Find all parcels owned by 7-Eleven in Dallas County, Texas. Limit your result with the
   * `limit` parameter.
   *  Dallas County has additional fields from the county that we provide users, set
   * `return_custom` to true to view all
   *  fields. **Attention API Trial Token Users:** Data is restricted to 7 counties. Please
   * only use data from one of the restricted counties.
   *
   * @summary Sample Use Case - FIPS code and Owner Name
   * @throws FetchError<400, types.GetParcelsQueryFieldsGeoidEq48113FieldsOwnerIlike7ElevenIncResponse400> Invalid requests return informative 400 error
   * @throws FetchError<401, types.GetParcelsQueryFieldsGeoidEq48113FieldsOwnerIlike7ElevenIncResponse401> Unauthorized
   */
  getParcelsQueryFieldsGeoidEq48113FieldsOwnerIlike7ElevenInc(metadata: types.GetParcelsQueryFieldsGeoidEq48113FieldsOwnerIlike7ElevenIncMetadataParam): Promise<FetchResponse<200, types.GetParcelsQueryFieldsGeoidEq48113FieldsOwnerIlike7ElevenIncResponse200>> {
    return this.core.fetch('/parcels/query?fields[geoid][eq]=48113&fields[owner][ilike]=7 ELEVEN INC', 'get', metadata);
  }

  /**
   * Find businesses in Downtown Indianapolis within a specific zip code. These are parcels
   * marked as Shopping, business, or trade activities. Limit your result with the `limit`
   * parameter **Attention API Trial Token Users:** Data is restricted to 7 counties. Please
   * only use data from one of the restricted counties.
   *
   * @summary Sample Use Case - Zip Code, Land Use Code and State
   * @throws FetchError<400, types.GetParcelsQueryFieldsSzipEq46202FieldsLbcsActivityBetween20002999FieldsState2EqInResponse400> Invalid requests return informative 400 error
   * @throws FetchError<401, types.GetParcelsQueryFieldsSzipEq46202FieldsLbcsActivityBetween20002999FieldsState2EqInResponse401> Unauthorized
   */
  getParcelsQueryFieldsSzipEq46202FieldsLbcs_activityBetween20002999FieldsState2EqIn(metadata: types.GetParcelsQueryFieldsSzipEq46202FieldsLbcsActivityBetween20002999FieldsState2EqInMetadataParam): Promise<FetchResponse<200, types.GetParcelsQueryFieldsSzipEq46202FieldsLbcsActivityBetween20002999FieldsState2EqInResponse200>> {
    return this.core.fetch('/parcels/query?fields[szip][eq]=46202&fields[lbcs_activity][between]=[2000,2999]&fields[state2][eq]=IN', 'get', metadata);
  }

  /**
   * Find all the telecommunication parcels in Dallas County, Texas. Want to double check the
   * count, use `return_count` parameter to get the total **Attention API Trial Token
   * Users:** Data is restricted to 7 counties. Please only use data from one of the
   * restricted counties.
   *
   * @summary Sample Use Case - Land Use Code and FIPS Code
   * @throws FetchError<400, types.GetParcelsQueryFieldsLbcsActivityEq4340FieldsGeoidEq48113Response400> Invalid requests return informative 400 error
   * @throws FetchError<401, types.GetParcelsQueryFieldsLbcsActivityEq4340FieldsGeoidEq48113Response401> Unauthorized
   */
  getParcelsQueryFieldsLbcs_activityEq4340FieldsGeoidEq48113(metadata: types.GetParcelsQueryFieldsLbcsActivityEq4340FieldsGeoidEq48113MetadataParam): Promise<FetchResponse<200, types.GetParcelsQueryFieldsLbcsActivityEq4340FieldsGeoidEq48113Response200>> {
    return this.core.fetch('/parcels/query?fields[lbcs_activity][eq]=4340&fields[geoid][eq]=48113', 'get', metadata);
  }

  /**
   * Locate all the residential properties in a polygon area where the land value is greater
   * or equal to $100,000.  **Attention API Trial Token Users:** Data is restricted to 7
   * counties. Please only use data from one of the  restricted counties.
   *
   * @summary Sample Use Case - Polygon Area, Land Use Code and Land Value
   * @throws FetchError<400, types.GetParcelsQueryFieldsLbcsActivityEq1100FieldsLandvalGte100000Response400> Invalid requests return informative 400 error
   * @throws FetchError<401, types.GetParcelsQueryFieldsLbcsActivityEq1100FieldsLandvalGte100000Response401> Unauthorized
   */
  getParcelsQueryFieldsLbcs_activityEq1100FieldsLandvalGte100000(metadata: types.GetParcelsQueryFieldsLbcsActivityEq1100FieldsLandvalGte100000MetadataParam): Promise<FetchResponse<200, types.GetParcelsQueryFieldsLbcsActivityEq1100FieldsLandvalGte100000Response200>> {
    return this.core.fetch('/parcels/query?fields[lbcs_activity][eq]=1100&fields[landval][gte]=100000', 'get', metadata);
  }

  /**
   * Search for parcels in a specific geographical area. This endpoint allows access to test
   * all our premium matched datasets with applicable API token. Accepted formats vary from
   * GeoJSON Feature Collection of geometries (Polygon, MultiPolygon, Point, MultiPoint,
   * LineString and/or MultiLineString), or a Feature with a GeoJSON geometry or a direct
   * GeoJSON geometry. Parameter 'geojson' takes priority if Lat/Long used in same request.
   * These parameters also accept an optional radius parameter in meters to create a buffer
   * around the given geometries. Note adding a radius can increase the overall area of the
   * request reaching the area size limit per request.
   *
   * @summary Area Geometry Search
   * @throws FetchError<401, types.GetParcelsAreaResponse401> Unauthorized
   */
  getParcelsArea(metadata: types.GetParcelsAreaMetadataParam): Promise<FetchResponse<200, types.GetParcelsAreaResponse200>> {
    return this.core.fetch('/parcels/area', 'get', metadata);
  }

  /**
   * Search for parcels in a specific geographical area. This endpoint allows access to test
   * all our premium matched datasets with applicable API token. Accepted formats vary from
   * GeoJSON Feature Collection of geometries (Polygon, MultiPolygon, Point, MultiPoint,
   * LineString and/or MultiLineString), or a Feature with a GeoJSON geometry or a direct
   * GeoJSON geometry. These parameters also accept an optional radius parameter in meters to
   * create a buffer around the given geometries. Note adding a radius can increase the
   * overall area of the request reaching the area size limit per request.
   *
   * @summary Area Geometry Search
   * @throws FetchError<401, types.PostParcelsAreaResponse401> Unauthorized
   */
  postParcelsArea(body: types.PostParcelsAreaBodyParam, metadata?: types.PostParcelsAreaMetadataParam): Promise<FetchResponse<200, types.PostParcelsAreaResponse200>> {
    return this.core.fetch('/parcels/area', 'post', body, metadata);
  }

  /**
   * This endpoint delivers a full address lookup and validation with corresponding unique
   * identifier for each parcel based on matching the query. This is a Regrid Enterprise
   * product. **Attention API Trial Token Users:** Data is restricted to 7 counties. Please
   * only use data from one of the restricted counties.
   *
   * @summary Typeahead
   * @throws FetchError<401, types.GetParcelsTypeaheadResponse401> Unauthorized
   */
  getParcelsTypeahead(metadata: types.GetParcelsTypeaheadMetadataParam): Promise<FetchResponse<200, types.GetParcelsTypeaheadResponse200>> {
    return this.core.fetch('/parcels/typeahead', 'get', metadata);
  }

  /**
   * This endpoint delivers a single parcel record based on the unique path. This is best
   * used in combination with the  Typeahead API endpoint. This endpoint allows access to
   * test all of our premium matched datasets with applicable API token.
   *
   * @summary Parcel Path
   * @throws FetchError<401, types.GetParcelsPathResponse401> Unauthorized
   */
  getParcelsPath(metadata: types.GetParcelsPathMetadataParam): Promise<FetchResponse<200, types.GetParcelsPathResponse200>> {
    return this.core.fetch('/parcels/path', 'get', metadata);
  }

  /**
   * This endpoint delivers a single parcel record based on the Regrid id (ll_uuid).
   *
   * @summary Regrid ID
   * @throws FetchError<401, types.GetParcelsLlUuidResponse401> Unauthorized
   */
  getParcelsLl_uuid(metadata: types.GetParcelsLlUuidMetadataParam): Promise<FetchResponse<200, types.GetParcelsLlUuidResponse200>> {
    return this.core.fetch('/parcels/{ll_uuid}', 'get', metadata);
  }

  /**
   * If a client-facing web page is making requests directly to our service, it will need an
   * access token. To avoid exposing your main account's token to the public, we recommend
   * using temporary client tokens. The process looks like this:
   * - When generating page content, your server asks the Regrid API for a temporary client
   * token limited to typeahead calls (details below). You can create as many of these as
   * desired, for free.
   * - The javascript autocomplete widget uses this token to call Typeahead API
   * - If it's invalid or expired, the request will return an HTTP code 400. You may wish to
   * refresh the page to regenerate the client token
   *
   * @summary client token
   * @throws FetchError<401, types.GetClientTokenTypeaheadResponse401> Unauthorized
   */
  getClient_tokenTypeahead(metadata: types.GetClientTokenTypeaheadMetadataParam): Promise<FetchResponse<200, types.GetClientTokenTypeaheadResponse200>> {
    return this.core.fetch('/client_token/typeahead', 'get', metadata);
  }

  /**
   * This endpoint retrieves the current Regrid Parcel Schema. You can use 'premium_only' to
   * retrieve the schema listed for only premium fields.
   *
   * @summary Regrid Parcel Schema
   */
  getSchemasParcel(metadata?: types.GetSchemasParcelMetadataParam): Promise<FetchResponse<200, types.GetSchemasParcelResponse200>> {
    return this.core.fetch('/schemas/parcel', 'get', metadata);
  }

  /**
   * This endpoint retrieves the current Regrid Matched Building Footprints schema.
   *
   * @summary Matched Buildings Schema
   */
  getSchemasBuilding(): Promise<FetchResponse<200, types.GetSchemasBuildingResponse200>> {
    return this.core.fetch('/schemas/building', 'get');
  }

  /**
   * This endpoints retrieves the current Regrid Matched Secondary Addresses
   *
   * @summary Matched Addresses Schema
   */
  getSchemasAddress(): Promise<FetchResponse<200, types.GetSchemasAddressResponse200>> {
    return this.core.fetch('/schemas/address', 'get');
  }

  /**
   * This endpoint retrieves the current Regrid Enhanced Ownership Schema.
   *
   * @summary Enhanced Ownership Schema
   */
  getSchemasEnhanced_ownership(): Promise<FetchResponse<200, types.GetSchemasEnhancedOwnershipResponse200>> {
    return this.core.fetch('/schemas/enhanced_ownership', 'get');
  }

  /**
   * This endpoint retrieves the current Regrid Standardized Zoning Schema.
   *
   * @summary Standardized Zoning Schema
   */
  getSchemasZoning(): Promise<FetchResponse<200, types.GetSchemasZoningResponse200>> {
    return this.core.fetch('/schemas/zoning', 'get');
  }

  /**
   * This endpoint retrieves all records from our verse schema. These records are counties in
   * the United States and Puerto Rico that tell the last time we did a full data pull from
   * the source.
   *
   * @summary County Metadata (Verse)
   */
  getVerse(metadata?: types.GetVerseMetadataParam): Promise<FetchResponse<200, types.GetVerseResponse200>> {
    return this.core.fetch('/verse', 'get', metadata);
  }

  /**
   * Check your current API usage stats to see how many requests, parcel records, and tiles
   * have been used. You can see full history with using the parameter 'return_full_history'
   * or specify a specific date range.
   *
   * @summary Usage
   * @throws FetchError<401, types.GetUsageResponse401> Unauthorized
   */
  getUsage(metadata?: types.GetUsageMetadataParam): Promise<FetchResponse<200, types.GetUsageResponse200>> {
    return this.core.fetch('/usage', 'get', metadata);
  }

  /**
   * You can report issues with specific parcels or general areas to us using this report
   * endpoint. Reports help us prioritize updates. However, we cannot apply data received to
   * this endpoint directly to our parcel data or respond individually to specific reports.
   *
   * @summary Reporting Data Issues to Regrid
   * @throws FetchError<400, types.PostReportResponse400> Invalid request
   * @throws FetchError<401, types.PostReportResponse401> Unauthorized
   */
  postReport(metadata?: types.PostReportMetadataParam): Promise<FetchResponse<200, types.PostReportResponse200>> {
    return this.core.fetch('/report', 'post', metadata);
  }

  /**
   * This endpoint retrieves the current Standardized Canada Schema.
   *
   * @summary Standardized Canada Schema
   */
  getSchemasCa(): Promise<FetchResponse<200, types.GetSchemasCaResponse200>> {
    return this.core.fetch('/schemas/ca', 'get');
  }

  /**
   * This endpoint delivers parcels using latitude and longitude points. You can add a radius
   * zone to the point or points and limit the amount of parcels returned in the response.
   * Parameter 'geojson' takes priority if Lat/Lon is used in same request. This endpoint
   * allows access to test all of our premium matched datasets. **Attention API Trial Token
   * Users:** Data is restricted to 7 counties. Please only use data from one of the
   * restricted counties.
   *
   * @summary Point - Latitude and Longitude
   * @throws FetchError<401, types.GetCaParcelsPointResponse401> Unauthorized
   */
  getCaParcelsPoint(metadata?: types.GetCaParcelsPointMetadataParam): Promise<FetchResponse<200, types.GetCaParcelsPointResponse200>> {
    return this.core.fetch('/ca/parcels/point', 'get', metadata);
  }

  /**
   * This endpoint delivers parcels using latitude and longitude points. You can add a radius
   * zone to the point or points and limit the amount of parcels returned in the response.
   * Parameter 'geojson' takes priority if Lat/Lon is used in same request. This endpoint
   * allows access to test all of our premium matched datasets. **Attention API Trial Token
   * Users:** Data is restricted to 7 counties. Please only use data from one of the
   * restricted counties.
   *
   * @summary Point - Latitude and Longitude
   * @throws FetchError<401, types.PostCaParcelsPointResponse401> Unauthorized
   */
  postCaParcelsPoint(body: types.PostCaParcelsPointBodyParam, metadata?: types.PostCaParcelsPointMetadataParam): Promise<FetchResponse<200, types.PostCaParcelsPointResponse200>> {
    return this.core.fetch('/ca/parcels/point', 'post', body, metadata);
  }

  /**
   * Search for parcels in a specific geographical area. This endpoint allows access to test
   * all our premium matched datasets with applicable API token. Accepted formats vary from
   * GeoJSON Feature Collection of geometries (Polygon, MultiPolygon, Point, MultiPoint,
   * LineString and/or MultiLineString), or a Feature with a GeoJSON geometry or a direct
   * GeoJSON geometry. Parameter 'geojson' takes priority if Lat/Long used in same request.
   * These parameters also accept an optional radius parameter in meters to create a buffer
   * around the given geometries. Note adding a radius can increase the overall area of the
   * request reaching the area size limit per request.
   *
   * @summary Area Geometry Search
   * @throws FetchError<401, types.GetCaParcelsAreaResponse401> Unauthorized
   */
  getCaParcelsArea(metadata: types.GetCaParcelsAreaMetadataParam): Promise<FetchResponse<200, types.GetCaParcelsAreaResponse200>> {
    return this.core.fetch('/ca/parcels/area', 'get', metadata);
  }

  /**
   * Search for parcels in a specific geographical area. This endpoint allows access to test
   * all our premium matched  datasets with applicable API token. Accepted formats vary from
   * GeoJSON Feature Collection of geometries (Polygon, MultiPolygon,  Point, MultiPoint,
   * LineString and/or MultiLineString), or a Feature with a GeoJSON geometry or a direct
   * GeoJSON geometry.  These parameters also accept an optional radius parameter in meters
   * to create a buffer around the given geometries.  Note adding a radius can increase the
   * overall area of the request reaching the area size limit per request.
   *
   * @summary Area Geometry Search
   * @throws FetchError<401, types.PostCaParcelsAreaResponse401> Unauthorized
   */
  postCaParcelsArea(body: types.PostCaParcelsAreaBodyParam, metadata?: types.PostCaParcelsAreaMetadataParam): Promise<FetchResponse<200, types.PostCaParcelsAreaResponse200>> {
    return this.core.fetch('/ca/parcels/area', 'post', body, metadata);
  }

  /**
   * This endpoint delivers parcels using an address within Canada. There can be multiple
   * locations within Canada with similar addresses and therefore we suggest specifying the
   * location within an admin1 and/or admin2 by using the `path` parameter.
   *
   * @summary Address Search
   * @throws FetchError<401, types.GetCaParcelsAddressResponse401> Unauthorized
   */
  getCaParcelsAddress(metadata: types.GetCaParcelsAddressMetadataParam): Promise<FetchResponse<200, types.GetCaParcelsAddressResponse200>> {
    return this.core.fetch('/ca/parcels/address', 'get', metadata);
  }

  /**
   * This endpoint delivers a single parcel record based on the Regrid id (ll_uuid).
   *
   * @summary Regrid ID
   * @throws FetchError<401, types.GetCaParcelsLlUuidResponse401> Unauthorized
   */
  getCaParcelsLl_uuid(metadata: types.GetCaParcelsLlUuidMetadataParam): Promise<FetchResponse<200, types.GetCaParcelsLlUuidResponse200>> {
    return this.core.fetch('/ca/parcels/{ll_uuid}', 'get', metadata);
  }

  /**
   * This endpoint delivers parcels using the Assessor Parcel Number (APN) which is assigned
   * to each parcel by the respective admin2. Multiple parcels can be returned depending on
   * the APN, therefore specify the location within an admin1, admin2 admin3 by using the
   * parameter `path`. **Attention API Trial Token Users:** Data is restricted to 7 counties.
   * Please only use data from one of the restricted counties.
   *
   * @summary Assessor Parcel Number (APN) Search
   * @throws FetchError<401, types.GetCaParcelsApnResponse401> Unauthorized
   */
  getCaParcelsApn(metadata: types.GetCaParcelsApnMetadataParam): Promise<FetchResponse<200, types.GetCaParcelsApnResponse200>> {
    return this.core.fetch('/ca/parcels/apn', 'get', metadata);
  }

  /**
   * The Regrid API offers a flexible and dynamic set of features for querying Regrid Parcels
   * by numerous fields,  operators, geometries and allows for simple composition of API
   * calls, from the output of one endpoint, to the  input of another. Multiple fields can be
   * used in a single query (up to 4), to refine results. [<i>See full list of
   * fields</i>](https://support.regrid.com/api/international-api). Check out Sample Use Case
   * Scenarios in this section
   *
   * @summary Overview
   * @throws FetchError<400, types.GetCaParcelsQueryResponse400> Invalid requests return informative 400 error
   * @throws FetchError<401, types.GetCaParcelsQueryResponse401> Unauthorized
   */
  getCaParcelsQuery(metadata?: types.GetCaParcelsQueryMetadataParam): Promise<FetchResponse<200, types.GetCaParcelsQueryResponse200>> {
    return this.core.fetch('/ca/parcels/query', 'get', metadata);
  }

  /**
   * Find all parcels with FIPS geoid 4622 and Postcode R0B 0J0. Limit your result with the
   * `limit` parameter.
   *
   * @summary Sample Use Case - FIPS geoid and Postcode
   * @throws FetchError<401, types.GetCaParcelsQueryFieldsGeoidEq4622FieldsPostcodeEqR0B0J0Response401> Unauthorized
   */
  getCaParcelsQueryFieldsGeoidEq4622FieldsPostcodeEqR0b0j0(metadata: types.GetCaParcelsQueryFieldsGeoidEq4622FieldsPostcodeEqR0B0J0MetadataParam): Promise<FetchResponse<200, types.GetCaParcelsQueryFieldsGeoidEq4622FieldsPostcodeEqR0B0J0Response200>> {
    return this.core.fetch('/ca/parcels/query?fields[geoid][eq]=4622&fields[postcode][eq]=R0B 0J0', 'get', metadata);
  }

  /**
   * This endpoint delivers a single parcel record based on the unique path. This is best
   * used in combination with the  Typeahead API endpoint. This endpoint allows access to
   * test all of our premium matched datasets with applicable API token.
   *
   * @summary Parcel Path
   * @throws FetchError<401, types.GetCaParcelsPathResponse401> Unauthorized
   */
  getCaParcelsPath(metadata: types.GetCaParcelsPathMetadataParam): Promise<FetchResponse<200, types.GetCaParcelsPathResponse200>> {
    return this.core.fetch('/ca/parcels/path', 'get', metadata);
  }

  /**
   * This endpoint retrieves all Canadian records from our verse schema. These records are
   * admins2's that tell the last time we did a full data pull from the source.
   *
   * @summary County Metadata (Verse)
   */
  getCaVerse(metadata?: types.GetCaVerseMetadataParam): Promise<FetchResponse<200, types.GetCaVerseResponse200>> {
    return this.core.fetch('/ca/verse', 'get', metadata);
  }

  /**
   * Check your current API usage stats to see how many requests, parcel records, and tiles
   * have been used. You can see full history with using the parameter 'return_full_history'
   * or specify a specific date range.
   *
   * @summary Usage
   * @throws FetchError<401, types.GetCaUsageResponse401> Unauthorized
   */
  getCaUsage(metadata?: types.GetCaUsageMetadataParam): Promise<FetchResponse<200, types.GetCaUsageResponse200>> {
    return this.core.fetch('/ca/usage', 'get', metadata);
  }
}

const createSDK = (() => { return new SDK(); })()
;

export default createSDK;

export type { GetCaParcelsAddressMetadataParam, GetCaParcelsAddressResponse200, GetCaParcelsAddressResponse401, GetCaParcelsApnMetadataParam, GetCaParcelsApnResponse200, GetCaParcelsApnResponse401, GetCaParcelsAreaMetadataParam, GetCaParcelsAreaResponse200, GetCaParcelsAreaResponse401, GetCaParcelsLlUuidMetadataParam, GetCaParcelsLlUuidResponse200, GetCaParcelsLlUuidResponse401, GetCaParcelsPathMetadataParam, GetCaParcelsPathResponse200, GetCaParcelsPathResponse401, GetCaParcelsPointMetadataParam, GetCaParcelsPointResponse200, GetCaParcelsPointResponse401, GetCaParcelsQueryFieldsGeoidEq4622FieldsPostcodeEqR0B0J0MetadataParam, GetCaParcelsQueryFieldsGeoidEq4622FieldsPostcodeEqR0B0J0Response200, GetCaParcelsQueryFieldsGeoidEq4622FieldsPostcodeEqR0B0J0Response401, GetCaParcelsQueryMetadataParam, GetCaParcelsQueryResponse200, GetCaParcelsQueryResponse400, GetCaParcelsQueryResponse401, GetCaUsageMetadataParam, GetCaUsageResponse200, GetCaUsageResponse401, GetCaVerseMetadataParam, GetCaVerseResponse200, GetClientTokenTypeaheadMetadataParam, GetClientTokenTypeaheadResponse200, GetClientTokenTypeaheadResponse401, GetParcelsAddressMetadataParam, GetParcelsAddressResponse200, GetParcelsAddressResponse401, GetParcelsApnMetadataParam, GetParcelsApnResponse200, GetParcelsApnResponse401, GetParcelsAreaMetadataParam, GetParcelsAreaResponse200, GetParcelsAreaResponse401, GetParcelsLlUuidMetadataParam, GetParcelsLlUuidResponse200, GetParcelsLlUuidResponse401, GetParcelsOwnerMetadataParam, GetParcelsOwnerResponse200, GetParcelsOwnerResponse401, GetParcelsPathMetadataParam, GetParcelsPathResponse200, GetParcelsPathResponse401, GetParcelsPointMetadataParam, GetParcelsPointResponse200, GetParcelsPointResponse401, GetParcelsQueryFieldsGeoidEq48113FieldsOwnerIlike7ElevenIncMetadataParam, GetParcelsQueryFieldsGeoidEq48113FieldsOwnerIlike7ElevenIncResponse200, GetParcelsQueryFieldsGeoidEq48113FieldsOwnerIlike7ElevenIncResponse400, GetParcelsQueryFieldsGeoidEq48113FieldsOwnerIlike7ElevenIncResponse401, GetParcelsQueryFieldsLbcsActivityEq1100FieldsLandvalGte100000MetadataParam, GetParcelsQueryFieldsLbcsActivityEq1100FieldsLandvalGte100000Response200, GetParcelsQueryFieldsLbcsActivityEq1100FieldsLandvalGte100000Response400, GetParcelsQueryFieldsLbcsActivityEq1100FieldsLandvalGte100000Response401, GetParcelsQueryFieldsLbcsActivityEq4340FieldsGeoidEq48113MetadataParam, GetParcelsQueryFieldsLbcsActivityEq4340FieldsGeoidEq48113Response200, GetParcelsQueryFieldsLbcsActivityEq4340FieldsGeoidEq48113Response400, GetParcelsQueryFieldsLbcsActivityEq4340FieldsGeoidEq48113Response401, GetParcelsQueryFieldsSzipEq46202FieldsLbcsActivityBetween20002999FieldsState2EqInMetadataParam, GetParcelsQueryFieldsSzipEq46202FieldsLbcsActivityBetween20002999FieldsState2EqInResponse200, GetParcelsQueryFieldsSzipEq46202FieldsLbcsActivityBetween20002999FieldsState2EqInResponse400, GetParcelsQueryFieldsSzipEq46202FieldsLbcsActivityBetween20002999FieldsState2EqInResponse401, GetParcelsQueryMetadataParam, GetParcelsQueryResponse200, GetParcelsQueryResponse400, GetParcelsQueryResponse401, GetParcelsTypeaheadMetadataParam, GetParcelsTypeaheadResponse200, GetParcelsTypeaheadResponse401, GetSchemasAddressResponse200, GetSchemasBuildingResponse200, GetSchemasCaResponse200, GetSchemasEnhancedOwnershipResponse200, GetSchemasParcelMetadataParam, GetSchemasParcelResponse200, GetSchemasZoningResponse200, GetUsageMetadataParam, GetUsageResponse200, GetUsageResponse401, GetVerseMetadataParam, GetVerseResponse200, PostCaParcelsAreaBodyParam, PostCaParcelsAreaMetadataParam, PostCaParcelsAreaResponse200, PostCaParcelsAreaResponse401, PostCaParcelsPointBodyParam, PostCaParcelsPointMetadataParam, PostCaParcelsPointResponse200, PostCaParcelsPointResponse401, PostParcelsAreaBodyParam, PostParcelsAreaMetadataParam, PostParcelsAreaResponse200, PostParcelsAreaResponse401, PostParcelsPointBodyParam, PostParcelsPointMetadataParam, PostParcelsPointResponse200, PostParcelsPointResponse401, PostReportMetadataParam, PostReportResponse200, PostReportResponse400, PostReportResponse401 } from './types';
