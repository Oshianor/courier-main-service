const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");

const complexityOptions = {
  min: 6,
  max: 20,
  lowerCase: 1,
  upperCase: 1,
  numeric: 1,
  symbol: 1,
  requirementCount: 2,
};

// validate create company
function validateCompany(body) {
  const schema = Joi.object({
    name: Joi.string().label("Company Name").required(),
    email: Joi.string().email().label("Email Address").max(50).required(),
    address: Joi.string().label("Address").max(225).required(),
    phoneNumber: Joi.string().label("Phone Number").min(10).max(10).required(),
    contactEmail: Joi.string().email().label("Contact Email Address").max(50).required(),
    description: Joi.string().label("Description").max(3000).required(),
    postcode: Joi.number().label("Postal Code").max(99999999).required(),
    contactName: Joi.string().label("Contact Name").max(30).required(),
    contactPhoneNumber: Joi.string()
      .label("Contact Phone Number")
      .min(10)
      .max(10)
      .required(),
    RCNumber: Joi.string().label("RC Number").required(),
    TIN: Joi.string().label("T.I.N").required(),
    country: Joi.string().label("Country").required(),
    state: Joi.string().label("State").required(),
    vehicles: Joi.array()
      .items(
        Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/)
          .required()
      )
      .required(),
    password: passwordComplexity(complexityOptions)
      .label("Password")
      .required(),
    confirmPassword: passwordComplexity(complexityOptions)
      .label("Confirm Password")
      .valid(Joi.ref("password"))
      .required(),
  });

  return schema.validate(body);
}

// validate login as company
function validateCompanyLogin(body) {
  const schema = Joi.object({
    email: Joi.string().email().max(50).required(),
    password: passwordComplexity(complexityOptions).required(),
  });

  return schema.validate(body);
}

function validateUpdateCompany(body) {
  const schema = Joi.object({
    name: Joi.string().label("Company Name").max(50).optional(),
    email: Joi.string().email().label("Email Address").max(50).optional(),
    address: Joi.string().label("Address").max(225).optional(),
    contactName: Joi.string().label("Contact Name").max(30).optional(),
    contactPhoneNumber: Joi.string()
      .label("Contact Phone Number")
      .min(10)
      .max(10)
      .optional(),
    phoneNumber: Joi.string().label("Phone Number").min(10).max(10).optional(),
    RCNumber: Joi.string().label("RC Number").optional(),
    TIN: Joi.string().label("T.I.N").optional(),
    country: Joi.string().label("Country").optional(),
    state: Joi.string().label("State").optional(),
  });
  return schema.validate(body);
}

function validateStatusUpdate(body) {
  const schema = Joi.object({
    status: Joi.string().required().valid("active", "inactive", "suspended"),
  });

  return schema.validate(body);
}


// validate company verification
function validateVerifyCompany(body) {
  const schema = Joi.object({
    email: Joi.string().email().max(50).required(),
    token: Joi.string().max(225).required(),
  });

  return schema.validate(body);
}


// validate company verification
function validateCompanyVerification(body) {
  const schema = Joi.object({
    status: Joi.string().valid("approve", "decline").max(50).required(),
  });

  return schema.validate(body);
}

function validateChangePassword(body) {
  const schema = Joi.object({
    oldPassword: Joi.string().max(30).required(),
    newPassword: Joi.string().max(30).required(),
  });

  return schema.validate(body);
}


module.exports = {
  validateCompany,
  validateCompanyLogin,
  validateUpdateCompany,
  validateStatusUpdate,
  validateVerifyCompany,
  validateCompanyVerification,
  validateChangePassword
};
