const config = require("config");
const moment = require("moment")

// https://github.com/usecanvas/email-templates

Verification = (token, email, type) => {

  const urlConfig = {
    rider: {
      path: "set-password",
      source: ""
    },
    admin: {
      path: "set-password",
      source: config.get("application.adminSite")
    },
    company: {
      path: "set-company-password",
      source: config.get("application.companySite")
    },
  }
  // let link;
  // let path = "";
  // let source = "";
  const accountSite = config.get("application.accountSite");
  // if(["rider","admin"].includes(type)){
  //   path = "set-password";
  // }
  const link = `${accountSite}/${urlConfig[type].path}?t=${token}&e=${email}&type=${type}&s=${urlConfig[type].source}`;
  // if (type === "company") {
  //   link = `${config.get(
  //     "application.logisticsService"
  //   )}/api/v1/auth/verify/company?token=${token}&email=${email}`;
  // } else {
  //   link = `${config.get(
  //     "application.logisticsSite"
  //   )}/verify-account?t=${token}&e=${email}&type=${type}`;
  // }

  return `
		<html xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office"
  style="width:100%;font-family:arial, 'helvetica neue', helvetica, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">

<head>
  <meta http-equiv="Content-Security-Policy"
    content="script-src 'none'; connect-src 'none'; object-src 'none'; form-action 'none';">
  <meta charset="UTF-8">
  <meta content="width=device-width, initial-scale=1" name="viewport">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta content="telephone=no" name="format-detection">
  <title>Logistics - Welcome Email</title>
  <!--[if (mso 16)]>
    <style type="text/css">
    a {text-decoration: none;}
    </style>
    <![endif]-->
  <!--[if gte mso 9]><style>sup { font-size: 100% !important; }</style><![endif]-->
  <!--[if gte mso 9]>
<xml>
    <o:OfficeDocumentSettings>
    <o:AllowPNG></o:AllowPNG>
    <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
</xml>
<![endif]-->
  <!--[if !mso]><!-- -->
  <link href="https://fonts.googleapis.com/css?family=Lato:400,400i,700,700i" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css?family=Merriweather:400,400i,700,700i" rel="stylesheet">
  <!--<![endif]-->
  <link rel="shortcut icon" type="image/png" href="https://stripo.email/assets/img/favicon.png">
  <style type="text/css">
    #outlook a {
      padding: 0;
    }

    .ExternalClass {
      width: 100%;
    }

    .ExternalClass,
    .ExternalClass p,
    .ExternalClass span,
    .ExternalClass font,
    .ExternalClass td,
    .ExternalClass div {
      line-height: 100%;
    }

    .es-button {
      mso-style-priority: 100 !important;
      text-decoration: none !important;
    }

    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }

    .es-desk-hidden {
      display: none;
      float: left;
      overflow: hidden;
      width: 0;
      max-height: 0;
      line-height: 0;
      mso-hide: all;
    }

    @media only screen and (max-width:600px) {

      p,
      ul li,
      ol li,
      a {
        font-size: 16px !important;
        line-height: 150% !important
      }

      h1 {
        font-size: 30px !important;
        text-align: center;
        line-height: 120% !important
      }

      h2 {
        font-size: 26px !important;
        text-align: center;
        line-height: 120% !important
      }

      h3 {
        font-size: 20px !important;
        text-align: center;
        line-height: 120% !important
      }

      h1 a {
        font-size: 30px !important
      }

      h2 a {
        font-size: 26px !important
      }

      h3 a {
        font-size: 20px !important
      }

      .es-menu td a {
        font-size: 16px !important
      }

      .es-header-body p,
      .es-header-body ul li,
      .es-header-body ol li,
      .es-header-body a {
        font-size: 16px !important
      }

      .es-footer-body p,
      .es-footer-body ul li,
      .es-footer-body ol li,
      .es-footer-body a {
        font-size: 16px !important
      }

      .es-infoblock p,
      .es-infoblock ul li,
      .es-infoblock ol li,
      .es-infoblock a {
        font-size: 12px !important
      }

      *[class="gmail-fix"] {
        display: none !important
      }

      .es-m-txt-c,
      .es-m-txt-c h1,
      .es-m-txt-c h2,
      .es-m-txt-c h3 {
        text-align: center !important
      }

      .es-m-txt-r,
      .es-m-txt-r h1,
      .es-m-txt-r h2,
      .es-m-txt-r h3 {
        text-align: right !important
      }

      .es-m-txt-l,
      .es-m-txt-l h1,
      .es-m-txt-l h2,
      .es-m-txt-l h3 {
        text-align: left !important
      }

      .es-m-txt-r img,
      .es-m-txt-c img,
      .es-m-txt-l img {
        display: inline !important
      }

      .es-button-border {
        display: block !important
      }

      a.es-button {
        font-size: 20px !important;
        display: block !important;
        border-width: 10px 0px 10px 0px !important
      }

      .es-btn-fw {
        border-width: 10px 0px !important;
        text-align: center !important
      }

      .es-adaptive table,
      .es-btn-fw,
      .es-btn-fw-brdr,
      .es-left,
      .es-right {
        width: 100% !important
      }

      .es-content table,
      .es-header table,
      .es-footer table,
      .es-content,
      .es-footer,
      .es-header {
        width: 100% !important;
        max-width: 600px !important
      }

      .es-adapt-td {
        display: block !important;
        width: 100% !important
      }

      .adapt-img {
        width: 100% !important;
        height: auto !important
      }

      .es-m-p0 {
        padding: 0 !important
      }

      .es-m-p0r {
        padding-right: 0 !important
      }

      .es-m-p0l {
        padding-left: 0 !important
      }

      .es-m-p0t {
        padding-top: 0 !important
      }

      .es-m-p0b {
        padding-bottom: 0 !important
      }

      .es-m-p20b {
        padding-bottom: 20px !important
      }

      .es-mobile-hidden,
      .es-hidden {
        display: none !important
      }

      tr.es-desk-hidden,
      td.es-desk-hidden,
      table.es-desk-hidden {
        width: auto !important;
        overflow: visible !important;
        float: none !important;
        max-height: inherit !important;
        line-height: inherit !important
      }

      tr.es-desk-hidden {
        display: table-row !important
      }

      table.es-desk-hidden {
        display: table !important
      }

      td.es-desk-menu-hidden {
        display: table-cell !important
      }

      .es-menu td {
        width: 1% !important
      }

      table.es-table-not-adapt,
      .esd-block-html table {
        width: auto !important
      }

      table.es-social {
        display: inline-block !important
      }

      table.es-social td {
        display: inline-block !important
      }

      .es-m-p5 {
        padding: 5px !important
      }

      .es-m-p5t {
        padding-top: 5px !important
      }

      .es-m-p5b {
        padding-bottom: 5px !important
      }

      .es-m-p5r {
        padding-right: 5px !important
      }

      .es-m-p5l {
        padding-left: 5px !important
      }

      .es-m-p10 {
        padding: 10px !important
      }

      .es-m-p10t {
        padding-top: 10px !important
      }

      .es-m-p10b {
        padding-bottom: 10px !important
      }

      .es-m-p10r {
        padding-right: 10px !important
      }

      .es-m-p10l {
        padding-left: 10px !important
      }

      .es-m-p15 {
        padding: 15px !important
      }

      .es-m-p15t {
        padding-top: 15px !important
      }

      .es-m-p15b {
        padding-bottom: 15px !important
      }

      .es-m-p15r {
        padding-right: 15px !important
      }

      .es-m-p15l {
        padding-left: 15px !important
      }

      .es-m-p20 {
        padding: 20px !important
      }

      .es-m-p20t {
        padding-top: 20px !important
      }

      .es-m-p20r {
        padding-right: 20px !important
      }

      .es-m-p20l {
        padding-left: 20px !important
      }

      .es-m-p25 {
        padding: 25px !important
      }

      .es-m-p25t {
        padding-top: 25px !important
      }

      .es-m-p25b {
        padding-bottom: 25px !important
      }

      .es-m-p25r {
        padding-right: 25px !important
      }

      .es-m-p25l {
        padding-left: 25px !important
      }

      .es-m-p30 {
        padding: 30px !important
      }

      .es-m-p30t {
        padding-top: 30px !important
      }

      .es-m-p30b {
        padding-bottom: 30px !important
      }

      .es-m-p30r {
        padding-right: 30px !important
      }

      .es-m-p30l {
        padding-left: 30px !important
      }

      .es-m-p35 {
        padding: 35px !important
      }

      .es-m-p35t {
        padding-top: 35px !important
      }

      .es-m-p35b {
        padding-bottom: 35px !important
      }

      .es-m-p35r {
        padding-right: 35px !important
      }

      .es-m-p35l {
        padding-left: 35px !important
      }

      .es-m-p40 {
        padding: 40px !important
      }

      .es-m-p40t {
        padding-top: 40px !important
      }

      .es-m-p40b {
        padding-bottom: 40px !important
      }

      .es-m-p40r {
        padding-right: 40px !important
      }

      .es-m-p40l {
        padding-left: 40px !important
      }
    }
  </style>
</head>

<body
  style="width:100%;font-family:arial, 'helvetica neue', helvetica, sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;padding:0;Margin:0">
  <div class="es-wrapper-color" style="background-color:#F6F6F6">
    <!--[if gte mso 9]>
			<v:background xmlns:v="urn:schemas-microsoft-com:vml" fill="t">
				<v:fill type="tile" color="#f6f6f6"></v:fill>
			</v:background>
		<![endif]-->
    <table class="es-wrapper" width="100%" cellspacing="0" cellpadding="0"
      style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;padding:0;Margin:0;width:100%;height:100%;background-repeat:repeat;background-position:center top">
      <tbody>
        <tr style="border-collapse:collapse">
          <td valign="top" style="padding:0;Margin:0">
            <table class="es-content" cellspacing="0" cellpadding="0" align="center"
              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
              <tbody>
                <tr style="border-collapse:collapse">
                  <td align="center" style="padding:0;Margin:0">
                    <table class="es-content-body" cellspacing="0" cellpadding="0" bgcolor="#ffffff" align="center"
                      style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                      <tbody>
                        <tr style="border-collapse:collapse">
                          <td align="left" bgcolor="#e0e0e0"
                            style="padding:0;Margin:0;padding-top:20px;padding-left:20px;padding-right:20px;background-color:#E0E0E0">
                            <table cellpadding="0" cellspacing="0" width="100%"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tbody>
                                <tr style="border-collapse:collapse">
                                  <td class="es-m-p0r" valign="top" align="center"
                                    style="padding:0;Margin:0;width:560px">
                                    <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                      style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                      <tbody>
                                        <tr style="border-collapse:collapse">
                                          <td align="center"
                                            style="padding:0;Margin:0;padding-top:20px;padding-bottom:20px;font-size:0px">
                                            <img class="adapt-img"
                                              src="https://res.cloudinary.com/dkshl8nj6/image/upload/v1603720507/Exalt%20Images/Exalt_Logistics_Logo_libkpz.svg"
                                              alt=""
                                              style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                              width="170"></td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                        <tr style="border-collapse:collapse">
                          <td align="left" bgcolor="#101424"
                            style="padding:0;Margin:0;padding-top:20px;padding-left:20px;padding-right:20px;background-color:#101424">
                            <table width="100%" cellspacing="0" cellpadding="0"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tbody>
                                <tr style="border-collapse:collapse">
                                  <td valign="top" align="center" style="padding:0;Margin:0;width:560px">
                                    <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
                                      style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                      <tbody>
                                        <tr style="border-collapse:collapse">
                                          <td align="center" style="padding:0;Margin:0;font-size:0px"><img
                                              class="adapt-img"
                                              src="https://res.cloudinary.com/dkshl8nj6/image/upload/v1599493324/Reusable%20Assets/fire-cracker_bkagqy.svg"
                                              alt=""
                                              style="display:block;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic"
                                              height="46"></td>
                                        </tr>
                                        <tr style="border-collapse:collapse">
                                          <td align="left" style="padding:0;Margin:0;padding-top:10px">
                                            <h2
                                              style="Margin:0;line-height:48px;mso-line-height-rule:exactly;font-family:merriweather, georgia, 'times new roman', serif;font-size:24px;font-style:normal;font-weight:normal;color:#FFFFFF;text-align:center">
                                              <strong><span>Welcome to Exalt Logistics.</span></strong></h2>
                                            <h2
                                              style="Margin:0;line-height:48px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:24px;font-style:normal;font-weight:normal;color:#FFFFFF;text-align:center;display:none">
                                              <br></h2>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </td>
                                </tr>
                                <tr style="border-collapse:collapse">
                                  <td valign="top" align="center" style="padding:0;Margin:0;width:560px">
                                    <table width="100%" cellspacing="0" cellpadding="0" role="presentation"
                                      style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                      <tbody>
                                        <tr style="border-collapse:collapse">
                                          <td align="center"
                                            style="Margin:0;padding-left:10px;padding-right:10px;padding-top:25px;padding-bottom:30px">
                                            <p
                                              style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:12px;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:18px;color:#FFFFFF">
                                              We are so glad to have you join us at exalt logistics. Kindly proceed to
                                              verify your account and create a password to continue. We hope you have a
                                              splendid time with us. Welcome once again.&nbsp;</p>
                                            <h2
                                              style="Margin:0;line-height:29px;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:24px;font-style:normal;font-weight:normal;color:#FFFFFF;text-align:center;display:none">
                                              <br></h2>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                        <tr style="border-collapse:collapse">
                          <td align="left" bgcolor="#101424"
                            style="Margin:0;padding-bottom:10px;padding-top:20px;padding-left:20px;padding-right:20px;background-color:#101424">
                            <table cellpadding="0" cellspacing="0" width="100%"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tbody>
                                <tr style="border-collapse:collapse">
                                  <td align="center" valign="top" style="padding:0;Margin:0;width:560px">
                                    <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                      style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                      <tbody>
                                        <tr style="border-collapse:collapse">
                                          <td align="center"
                                            style="padding:0;Margin:0;padding-top:10px;padding-bottom:15px"><span
                                              class="es-button-border"
                                              style="border-style:solid;border-color:#2CB543;background:#F44336;border-width:0px;display:inline-block;border-radius:10px;width:auto"><a
                                                href=${link} class="es-button" target="_blank"
                                                style="mso-style-priority:100 !important;text-decoration:none;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:18px;color:#FFFFFF;border-style:solid;border-color:#F44336;border-width:15px 30px;display:inline-block;background:#F44336;border-radius:10px;font-weight:bold;font-style:normal;line-height:22px;width:auto;text-align:center">Verify
                                                Account</a></span></td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
            <table cellpadding="0" cellspacing="0" class="es-content" align="center"
              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;table-layout:fixed !important;width:100%">
              <tbody>
                <tr style="border-collapse:collapse">
                  <td align="center" style="padding:0;Margin:0">
                    <table bgcolor="#ffffff" class="es-content-body" align="center" cellpadding="0" cellspacing="0"
                      style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px;background-color:#FFFFFF;width:600px">
                      <tbody>
                        <tr style="border-collapse:collapse">
                          <td align="left" bgcolor="#e0e0e0"
                            style="padding:0;Margin:0;padding-top:20px;padding-left:20px;padding-right:20px;background-color:#E0E0E0">
                            <table cellpadding="0" cellspacing="0" width="100%"
                              style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                              <tbody>
                                <tr style="border-collapse:collapse">
                                  <td align="center" valign="top" style="padding:0;Margin:0;width:560px">
                                    <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                      style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                      <tbody>
                                        <tr style="border-collapse:collapse">
                                          <td align="center" style="padding:0;Margin:0">
                                            <p
                                              style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:14px;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333">
                                              <span
                                                style="font-family:lato, 'helvetica neue', helvetica, arial, sans-serif">Copyright
                                                2020 | Exalt Logistics |&nbsp;&nbsp;All right reserved</span><span
                                                data-cke-bookmark="1" style="display:none">&nbsp;</span></p>
                                          </td>
                                        </tr>
                                        <tr style="border-collapse:collapse">
                                          <td align="center" style="padding:0;Margin:0;padding-top:20px">
                                            <h4
                                              style="Margin:0;line-height:150%;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif">
                                              Our Mailing Address is:</h4>
                                            <p
                                              style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:14px;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333">
                                              <br>
                                              <span
                                                style="font-family:lato, 'helvetica neue', helvetica, arial, sans-serif">
                                                11 Olaide Tomori street, Ikeja<br>Lagos, Nigeria.</span><span data-cke-bookmark="1"
                                                style="display:none">&nbsp;
                                              </span>
                                            </p>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </td>
                                </tr>
                                <tr style="border-collapse:collapse">
                                  <td align="center" valign="top" style="padding:0;Margin:0;width:560px">
                                    <table cellpadding="0" cellspacing="0" width="100%" role="presentation"
                                      style="mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;border-spacing:0px">
                                      <tbody>
                                        <tr style="border-collapse:collapse">
                                          <td align="center"
                                            style="padding:0;Margin:0;padding-bottom:30px;padding-top:40px">
                                            <h4
                                              style="Margin:0;line-height:120%;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif">
                                              Contact Details</h4>
                                            <p
                                              style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:14px;font-family:arial, 'helvetica neue', helvetica, sans-serif;line-height:21px;color:#333333">
                                              (+234) 70 1947 8407
                                              <br>
                                              (+234) 70 3266 4079
                                              <br><br>
                                              <a
                                                href="mailto:support@exaltapp.com"
                                                style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:14px;text-decoration:underline;color:#FD0E31">support@exaltapp.com</a><br><a
                                                href="mailto:sales@exaltapp.com"
                                                style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:arial, 'helvetica neue', helvetica, sans-serif;font-size:14px;text-decoration:underline;color:#FD0E31">sales@exaltapp.com</a>
                                            </p>
                                            <p
                                              style="Margin:0;-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-size:14px;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;line-height:21px;color:#333333">
                                              <a href="mailto:sales@exaltapp.com"
                                                style="-webkit-text-size-adjust:none;-ms-text-size-adjust:none;mso-line-height-rule:exactly;font-family:lato, 'helvetica neue', helvetica, arial, sans-serif;font-size:14px;text-decoration:underline;color:#FD0E31"></a>
                                            </p><span data-cke-bookmark="1"
                                              style="display:none;line-height:150%">&nbsp;</span>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

</body>

</html>
	`;
};


module.exports = Verification;