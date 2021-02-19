

/**
 *
 * @param {*} dataArray
 * @param {*} model - enum (['enterprise'])
 */
const populateMultiple = async (dataArray, model, option) => {
  const enterpriseInstance = new (require("../services/enterprise"))();
  const userInstance = new (require("../services/user"))();

  let modelIds = [...new Set(dataArray.map(data => data[model]).filter(Boolean))]

  modelIds = modelIds.map((id) => id.toString());

  let modelDataArray = [];
  console.log("modelIds", modelIds);
  try{
    if(model === 'enterprise'){
      modelDataArray = await enterpriseInstance.getAll(modelIds);
    }
    if(model === 'user'){
      modelDataArray = await userInstance.getAll(modelIds, option)
    }
  } catch(error){
    console.log('Failed to populate multiple model data => ',error);
  }

  dataArray = dataArray.map((data) => ({
    ...data,
    [model]: modelDataArray.find((modelData) => modelData._id == data[model]) || null
  }));

  return dataArray;
}



/**
 *
 * @param {*} data
 * @param {*} model
 * @param {*} option
 */
const populateSingle = async (data, model, option) => {
  const enterpriseInstance = new (require("../services/enterprise"))();
  const userInstance = new (require("../services/user"))();

  let modelData = null;

  try{
    if(model === "enterprise"){
      modelData = await enterpriseInstance.get({ _id: data[model] });
    }
    if(model === "user"){
      modelData = await userInstance.get({ _id: data[model]}, option);
    }
  } catch(error){
    console.log('Failed to populate multiple model data => ',error);
  }

  data = {
    ...data,
    [model]: modelData
  }

  return data;
}

module.exports = {
  populateMultiple,
  populateSingle
}