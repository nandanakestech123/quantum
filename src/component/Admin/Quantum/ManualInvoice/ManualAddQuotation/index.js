import React, { Component } from "react";
import "./style.scss";
import { Link } from "react-router-dom";
import SimpleReactValidator from "simple-react-validator";
import {
  NormalInput,
  NormalSelect,
  NormalButton,
  NormalDateTime,
  NormalMultiSelect,
  NormalTextarea,
} from "component/common";
import { displayImg, dateFormat } from "service/helperFunctions";
import {
  getJobtitle,
  getCommonApi,
  commonCreateApi,
  commonUpdateApi,
  commonDeleteApi,
  
} from "redux/actions/common";

import {addManualPaymentSchedule, 
  removeManualPaymentSchedule} from "redux/actions/quotation";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { FormGroup, Label, Input } from "reactstrap";
import { withTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { Address } from "./address";
import { Details } from "./details";
import {
  createManualinvoice,
  updateManualinvoice,
  deleteManualinvoice,
} from "redux/actions/manualinvoice";
import { getTokenDetails } from "redux/actions/auth";
import { history } from "helpers";
import { PDFDownloadLink } from "@react-pdf/renderer";
import Invoice from "component/Admin/Report/Account/Invoice";
import { importInvoiceToXero } from "../../xero_invoice";
import closeIcon from "assets/images/close.png";

export class ManualAddQuotationClass extends Component {
  state = {
    formFields: {
      fk_manualinvoice: "",
      projectTitle: "",
      companyName: "",
      quoDate: new Date(),
      validity: "",
      attnTo: "",
      status: "",
      currency_id: "",
      preparedBy: "",
      remarks: "",
      contactPerson:[],
      paymentTerms:'',
      paymentSchedule:''
      
    },
    currencyOption:[],
    fkProject: "",
    statusOption: [],
    countryOption: [],
    stateOption: [],
    cityOption: [],

    disableEdit: false,
    is_loading: true,
    isMounted: true,
    cust_id:0,
    siteGstList: [],

    formFieldsBillingStored: [],
    formFieldsShippingStored: [],
    storedItemListStored: [],
    itemListBeforeEdit: [],
    formFieldsDetailsStored: {},

    active: false,
    currentValue: 0,
    navLinks: [
      { to: this.props.location.pathname, label: "Details", id: "Details" },
      { to: this.props.location.pathname, label: "Address", id: "Address" },
    ],
    selectedMenu: "Details",
    isPrintPdfClick: false,
    printData: {},
    visible: false,
    visibleCustomer: false,
    projectOption: [],
    customerOption:[],
    paymentScheduleAndTerms:[]
  };

  componentWillMount = () => {
    this.getStatus();
    this.getCountry();
    this.getState();
    this.getCity();
    this.getCurrency();
    this.getPaymentScheduleAndTerms();
    this.validator = new SimpleReactValidator({
      validators: {},
      element: (message) => (
        <span className="error-message text-danger validNo fs14">
          {message}
        </span>
      ),
      autoForceUpdate: this,
    });
  };

  componentDidMount = () => {
    if (this.props.location.state) {
      console.log("this.props.location.state", this.props.location.state);
      this.state.fkProject = this.props.location.state.projectFk;
      this.setState({ fkProject: this.state.fkProject });
      console.log(
        "this.props.location.state.projectFk",
        this.props.location.state.projectFk
      );
      console.log("this.state.fkProject", this.state.fkProject);
      this.autofillFromProject();
    }

    console.log("this.props", this.props);
    if (this.props.match.params.id) {
      this.getAutofillItemDetails();
      this.getPrintDataInfo();
    }
  };

  componentWillUnmount() {
    this.state.isMounted = false;
  }

  updateState = (data) => {
    if (this.state.isMounted) this.setState(data);
  };

  
  handleOutsideClick = e => {
    if (this.node != null) {
      if (this.node.contains(e.target)) {
        return;
      }
    }
    this.handleSearchClick();
  };
  search = () => {
    let { formFields } = this.state;
    this.props
      .getCommonApi(
        `projectsearch/?search=${formFields.projectTitle}`
      )
      .then(key => {
        let { status, data } = key;
        if (status === 200) {
          
          this.setState({ projectOption: data });
        }
      });
  };
  handleSearch = async event => {
    //    event.persist();
    let { formFields, visible } = this.state;
    formFields["projectTitle"] = event.target.value;
    visible = true;
     this.setState({ formFields, visible });
     this.search();
  };
  handleSearchClick = key => {
    if (!this.state.visible) {
      document.addEventListener("click", this.handleOutsideClick, false);
    } else {
      document.removeEventListener("click", this.handleOutsideClick, false);
    }

    if (this.state.visible) {
      this.search();
    }
    this.setState(prevState => ({
      visible: !prevState.visible,
    }));
  };

  handleSelectProject = async data => {
    let { formFields } = this.state;    
    formFields["projectTitle"] = data.title;
    formFields["companyName"]=data.customer_name;
    this.setState({cust_id:data.cust_id})
    this.props
    .getCommonApi(
      `custappt/?search=${data.customer_name}`
    )
    .then(key => {
      let { status, data } = key;
      if (status === 200) {
        if(data.length> 0){
        if(!data[0].cust_corporate){
          let { formFields } = this.state;
          formFields["attnTo"] = data[0].cust_name;
          formFields["contactPerson"]=[];
          }else{
            formFields["contactPerson"]=data[0].contactperson
          }
          
        }else{
          formFields["attnTo"]=formFields["companyName"];
          formFields["contactPerson"]=[];
        }
       ;
      }else if(status === 204){
        formFields["attnTo"]=formFields["companyName"];
        formFields["contactPerson"]=[];
      }
      this.setState({ formFields, projectOption: [] })
    });
    this.setState({ formFields, projectOption: [] });
    this.handleSearchClick();
    
  };

  handleSelectCustomer = async data => {
    let { formFields } = this.state;    
    formFields["companyName"] = data.cust_name;
    this.setState({cust_id:data.id});  
    if(!data.cust_corporate){
    formFields["attnTo"] = data.cust_name;
    }else{
      formFields["contactPerson"]=data.contactperson
    }
    this.setState({ formFields, customerOption: [] });
    this.handleCustomerSearchClick();
  };
  handleCustomerSearchClick = key => {
    if (!this.state.visibleCustomer) {
      document.addEventListener("click", this.handleOutsideCustomerClick, false);
    } else {
      document.removeEventListener("click", this.handleOutsideCustomerClick, false);
    }

    if (this.state.visibleCustomer) {
      this.searchCustomer();
    }
    this.setState(prevState => ({
      visibleCustomer: !prevState.visibleCustomer,
    }));
  };
  handleCustomerSearch = async event => {
    //    event.persist();
    let { formFields, visibleCustomer } = this.state;
    formFields["companyName"] = event.target.value;
    visibleCustomer = true;
     this.setState({ formFields, visibleCustomer });
     this.searchCustomer();
  };
  searchCustomer = () => {
    let { formFields } = this.state;
    this.props
      .getCommonApi(
        `custappt/?search=${formFields.companyName}`
      )
      .then(key => {
        let { status, data } = key;
        if (status === 200) { 
          this.setState({customerOption:data });
        }
      });
  };

  handleOutsideCustomerClick = e => {
    if (this.node != null) {
      if (this.node.contains(e.target)) {
        return;
      }
    }
    this.handleCustomerSearchClick();
  };

  getPrintDataInfo = () => {
    this.props
      .getCommonApi(`manualinvoicepdf/?searchid=${this.props.match.params.id}`)
      .then(async (res) => {
        console.log("res in printData", res);
        let { printData } = this.state;
        if (res.status == 200) {
          printData = res.data[0];
          this.setState({
            printData,
          });
        }
      });
  };

  handleClick = async (key) => {
    let { active, currentValue } = this.state;
    await this.setState({
      selectedMenu: key.id,
    });
    this.setState({
      active: true,
      currentValue: key.key,
      selected: key.id,
    });
  };

  handleChange = ({ target: { value, name } }) => {
    let formFields = Object.assign({}, this.state.formFields);

    formFields[name] = value;

    this.updateState({
      formFields,
    });
  };

  handleDatePick = async (name, value) => {
    // dateFormat(new Date())
    let { formFields } = this.state;
    formFields[name] = value;
    // formFields[name] = value;
    await this.updateState({
      formFields,
    });
  };

  getSiteGst = () => {
    let { siteGstList } = this.state;
    // statusOption = [];
    console.log("sdfsdhfghjghj", this.props);
    this.props
      .getCommonApi(
        `gstlist/?limit=100&searchsitecode=${this.props.tokenDetail.site_code}`
      )
      .then((res) => {
        console.log("res.data getSiteGst", res.data.dataList);
        siteGstList = res.data.dataList;
        this.setState({ siteGstList });
      });
  };

  getStatus = () => {
    let { statusOption } = this.state;
    statusOption = [];
    console.log("sdfsdhfghjghj", this.props);
    this.props.getCommonApi(`dropdown`).then((res) => {
      console.log("res.data", res);
      for (let key of res.data) {
        statusOption.push({
          value: key.id,
          label: key.dropdown_item,
          code: key.dropdown_desc,
          active: key.active,
        });
      }
      if (!this.props.match.params.id) {
        for (var i = 0; i < statusOption.length; i++) {
          if (statusOption[i].label == "Void") {
            statusOption.splice(i, 1);
          }
        }
      }
      console.log("statusOption", statusOption);
      this.setState({ statusOption });
      if (this.props.match.params.id) {
        this.autoFillForm();
      }
      if (this.props.tokenDetail) {
        this.getSiteGst();
      }
    });
  };

  getCurrency= () => {
    let { currencyOption } = this.state;
    currencyOption = [];
    this.props.getCommonApi(`currencytable`).then((res) => {
      for (let key of res.data) {
        currencyOption.push({
          value: key.id,
          label: key.curr_code,
          code: key.curr_code,
          rate:key.curr_rate,
          active: key.curr_isactive,
        });
      }
      this.setState({ currencyOption });
    });
  };
  getPaymentScheduleAndTerms =() => {
    if(this.props.match.params.id){
    let { paymentScheduleAndTerms } = this.state;
    paymentScheduleAndTerms = [];
    this.props.getCommonApi(`manualpayment/?searchqdetailid=${this.props.match.params.id}`).then((res) => {
      paymentScheduleAndTerms= res.data.map(x=>({id:x.id,paymentSchedule:x.payment_schedule,paymentTerms:x.payment_term}))
      this.setState({ paymentScheduleAndTerms });
    });
  }
  };
  getCountry = () => {
    let { countryOption } = this.state;
    countryOption = [];
    console.log("sdfsdhfghjghj", this.props);
    this.props.getCommonApi(`country`).then((res) => {
      console.log("res.data", res);
      for (let key of res.data) {
        countryOption.push({
          value: key.itm_id,
          label: key.itm_desc,
          code: key.itm_code,
          active: key.itm_isactive,
        });
      }
      console.log("countryOption", countryOption);
      this.setState({ countryOption });
    });
  };

  getState = () => {
    let { stateOption } = this.state;
    stateOption = [];
    console.log("sdfsdhfghjghj", this.props);
    this.props.getCommonApi(`state`).then((res) => {
      console.log("res.data", res);
      for (let key of res.data) {
        stateOption.push({
          value: key.itm_id,
          label: key.itm_desc,
          code: key.itm_code,
          active: key.itm_isactive,
        });
      }
      console.log("stateOption", stateOption);
      this.setState({ stateOption });
    });
  };

  getCity = () => {
    let { cityOption } = this.state;
    cityOption = [];
    console.log("sdfsdhfghjghj", this.props);
    this.props.getCommonApi(`city`).then((res) => {
      console.log("res.data", res);
      for (let key of res.data) {
        cityOption.push({
          value: key.itm_id,
          label: key.itm_desc,
          code: key.itm_code,
          active: key.itm_isactive,
        });
      }
      console.log("cityOption", cityOption);
      this.setState({ cityOption });
      if (this.props.match.params.id) {
        this.getAutofillAddress();
      }
    });
  };

  getCity = () => {
    let { cityOption } = this.state;
    cityOption = [];
    console.log("sdfsdhfghjghj", this.props);
    this.props.getCommonApi(`city`).then((res) => {
      console.log("res.data", res);
      for (let key of res.data) {
        cityOption.push({
          value: key.itm_id,
          label: key.itm_desc,
          code: key.itm_code,
          active: key.itm_isactive,
        });
      }
      console.log("cityOption", cityOption);
      this.setState({ cityOption });
      if (this.props.match.params.id) {
        this.getAutofillAddress();
      }
    });
  };

  autofillFromProject = () => {
    let { fkProject } = this.state;
    console.log("fkProject in autofill", fkProject);
    console.log("this.props.tokenDetail", this.props.tokenDetail);
    this.props
      .getCommonApi(`projectlist/?searchid=${fkProject}`)
      .then(async (res) => {
        console.log("project dataList", res.data.dataList);
        // custName = res.data.dataList[0].customer_name
        // this.state.projectList = res.data.dataList
        this.state.formFields["projectTitle"] = res.data.dataList[0].title;
        this.state.formFields["companyName"] =
          res.data.dataList[0].customer_name;
        this.state.formFields["attnTo"] = res.data.dataList[0].contact_person;
        this.state.formFields["preparedBy"] = this.props.tokenDetail.username;
        this.updateState(this.state.formFields);
        console.log("this.state.formFields", this.state.formFields);
      });
  };

  getAutofillItemDetails = () => {
    this.props
      .getCommonApi(
        `manualinvoicedetail/?searchqdetailid=${this.props.match.params.id}`
      )
      .then((res) => {
        console.log("res in getAutofillItemDetails", res);
        
        if (res.status == 200) {
          if (res.data[0].q_shipcost) {
            this.state.formFieldsDetailsStored.q_shipcost =
              res.data[0].q_shipcost;
          } else {
            this.state.formFieldsDetailsStored.q_shipcost = 0;
          }
          if (res.data[0].q_discount) {
            this.state.formFieldsDetailsStored.q_discount =
              res.data[0].q_discount;
          } else {
            this.state.formFieldsDetailsStored.q_discount = 0;
          }
          if (res.data[0].q_taxes) {
            this.state.formFieldsDetailsStored.q_taxes = res.data[0].q_taxes;
          } else {
            this.state.formFieldsDetailsStored.q_taxes = 0;
          }
          
          if(res.data[0].q_discpercent){
            this.state.formFieldsDetailsStored.q_discpercent=res.data[0].q_discpercent;
          }
          else{
            this.state.formFieldsDetailsStored.q_discpercent=0;
          }
          if (res.data[0].q_total) {
            this.state.formFieldsDetailsStored.q_total = res.data[0].q_total;
          } else {
            this.state.formFieldsDetailsStored.q_total = 0;
          }
          // this.state.formFieldsDetailsStored.push("q_shipcost":res.data[0].q_shipcost)
          this.setState(this.state.formFieldsDetailsStored);
          console.log(
            "this.state.formFieldsDetailsStored in getAutofillItemDetails",
            this.state.formFieldsDetailsStored
          );
        }
      });

    this.props
      .getCommonApi(
        `manualinvoiceitem/?searchqitemid=${this.props.match.params.id}`
      )
      .then((res) => {
        console.log("res in getAutofillItemDetails", res);
        // this.state.storedItemListStored = res.data.dataList
        if (res.status == 200) {
          for (let item of res.data.dataList) {
            this.state.storedItemListStored.push({
              item_code: item.quotation_itemcode,
              item_desc: item.quotation_itemdesc,
              item_remarks: item.quotation_itemremarks,
              item_price: item.quotation_unitprice,
              item_quantity: item.quotation_quantity,
              discount_amt:item.discount_amt,
              discount_percent:item.discount_percent,              
              editing: false,
            });
            this.state.itemListBeforeEdit.push({
              item_id: item.id,
              item_code: item.quotation_itemcode,
            });
          }
          this.setState(this.state.storedItemListStored);
          this.setState(this.state.itemListBeforeEdit);
          console.log(
            "this.state.storedItemListStored in getAutofillItemDetails",
            this.state.storedItemListStored
          );
          console.log(
            "this.state.storedItemListStored in itemListBeforeEdit",
            this.state.itemListBeforeEdit
          );
        }
        // this.state.formFieldsDetailsStored.q_shipcost = res.data[0].q_shipcost
        // this.state.formFieldsDetailsStored.q_discount = res.data[0].q_discount
        // this.state.formFieldsDetailsStored.q_taxes = res.data[0].q_taxes
        // this.state.formFieldsDetailsStored.q_total = res.data[0].q_total
        // this.setState(this.state.formFieldsDetailsStored)
      });
  };

  getAutofillAddress = () => {
    this.props
      .getCommonApi(
        `manualinvoiceaddr/?searchqaddrid=${this.props.match.params.id}`
      )
      .then((res) => {
        console.log("res in autofillAddr", res);
        if (res.status == 200) {
          this.state.formFieldsBillingStored.to = res.data[0].billto;
          this.state.formFieldsBillingStored.address1 = res.data[0].bill_addr1;
          this.state.formFieldsBillingStored.address2 = res.data[0].bill_addr2;
          this.state.formFieldsBillingStored.address3 = res.data[0].bill_addr3;
          this.state.formFieldsBillingStored.postalCode =
            res.data[0].bill_postalcode;
          if (res.data[0].bill_city) {
            //matching status name with the id to set prefill status in dropdown
            this.state.formFieldsBillingStored.city =
              this.state.cityOption.find(
                (option) => option.label === res.data[0].bill_city
              ).value;
          }
          if (res.data[0].bill_state) {
            //matching status name with the id to set prefill status in dropdown
            this.state.formFieldsBillingStored.state =
              this.state.stateOption.find(
                (option) => option.label === res.data[0].bill_state
              ).value;
          }
          if (res.data[0].bill_country) {
            //matching status name with the id to set prefill status in dropdown
            this.state.formFieldsBillingStored.country =
              this.state.countryOption.find(
                (option) => option.label === res.data[0].bill_country
              ).value;
          }

          this.state.formFieldsShippingStored.to = res.data[0].shipto;
          this.state.formFieldsShippingStored.address1 = res.data[0].ship_addr1;
          this.state.formFieldsShippingStored.address2 = res.data[0].ship_addr2;
          this.state.formFieldsShippingStored.address3 = res.data[0].ship_addr3;
          this.state.formFieldsShippingStored.postalCode =
            res.data[0].ship_postalcode;
          if (res.data[0].ship_city) {
            //matching status name with the id to set prefill status in dropdown
            this.state.formFieldsShippingStored.city =
              this.state.cityOption.find(
                (option) => option.label === res.data[0].ship_city
              ).value;
          }
          if (res.data[0].ship_state) {
            //matching status name with the id to set prefill status in dropdown
            this.state.formFieldsShippingStored.state =
              this.state.stateOption.find(
                (option) => option.label === res.data[0].ship_state
              ).value;
          }
          if (res.data[0].ship_country) {
            //matching status name with the id to set prefill status in dropdown
            this.state.formFieldsShippingStored.country =
              this.state.countryOption.find(
                (option) => option.label === res.data[0].ship_country
              ).value;
          }

          console.log(
            "this.state.formFieldsBillingStored in autofillAddr",
            this.state.formFieldsBillingStored
          );
          console.log(
            "this.state.formFieldsShippingStored in autofillAddr",
            this.state.formFieldsShippingStored
          );
          this.setState(this.state.formFieldsBillingStored);
          this.setState(this.state.formFieldsShippingStored);
        }
      });
  };

  storeAddressFields = (formFieldsBilling, formFieldsShipping) => {
    this.state.formFieldsBillingStored = formFieldsBilling;
    this.state.formFieldsShippingStored = formFieldsShipping;
    // this.state.formFieldsShippingStored = formFieldsShipping
    // this.setState(this.state.formFieldsBillingStored, this.state.formFieldsShippingStored)
    console.log("formFieldsBilling in addquo", formFieldsBilling);
    console.log("formFieldsShipping in addquo", formFieldsShipping);
    console.log(
      "formFieldsBillingStored in addquotation",
      this.state.formFieldsBillingStored
    );
    console.log(
      "formFieldsShippingStored in addquotation",
      this.state.formFieldsShippingStored
    );
    this.setState(this.state.formFieldsBillingStored);
    this.setState(this.state.formFieldsShippingStored);
  };

  storeItemDetails = (storedItemList, formFields) => {
    this.state.storedItemListStored = storedItemList;
    this.state.formFieldsDetailsStored = formFields;

    console.log("storedItemList in addquo", storedItemList);
    console.log("formFields in addquo", formFields);
    console.log(
      "storedItemListStored in addquotation",
      this.state.storedItemListStored
    );
    console.log(
      "formFieldsDetailsStored in addquotation",
      this.state.formFieldsDetailsStored
    );
    this.setState(this.state.storedItemListStored);
    this.setState(this.state.formFieldsDetailsStored);
  };

  autoFillForm = () => {
    let { disableEdit, statusOption } = this.state;

    this.props
      .getCommonApi(`manualinvoicelist/?searchid=${this.props.match.params.id}`)
      .then(async (res) => {
        console.log("quo dataList", res.data.dataList);
        // console.log("quo dataList cust name", res.data.dataList[0].customer_name);
        // custName = res.data.dataList[0].customer_name
        // this.state.projectList = res.data.dataList

        this.state.formFields["fk_manualinvoice"] =
          res.data.dataList[0].manualinv_number;
        this.state.formFields["projectTitle"] = res.data.dataList[0].title;
        this.state.formFields["companyName"] = res.data.dataList[0].company;
        this.state.formFields["quoDate"] = res.data.dataList[0].created_at;
        this.state.formFields["validity"] = res.data.dataList[0].validity;
        this.state.formFields["attnTo"] = res.data.dataList[0].contact_person;
        this.setState({cust_id:res.data.dataList[0].cust_id});
        console.log("statusOption in prefill", this.state.statusOption);
        console.log("res.data.dataList[0].status", res.data.dataList[0].status);
        console.log();
        // if status empty prevent err
        if (res.data.dataList[0].status) {
          //matching status name with the id to set prefill status in dropdown
          this.state.formFields["status"] = this.state.statusOption.find(
            (option) => option.label === res.data.dataList[0].status
          ).value;
          console.log(
            "res.data.dataList[0].status",
            res.data.dataList[0].status
          );
          if (res.data.dataList[0].status == "Posted") {
            disableEdit = true;

            for (var i = 0; i < statusOption.length; i++) {
              if (statusOption[i].label == "Posted") {
                statusOption = statusOption.filter((e) => e.label !== "Open");
              }
            }
            console.log("statusOption when status is posted", statusOption);

            this.setState({ disableEdit, statusOption });
            console.log("this.state.disableEdit", disableEdit);
          }
        }
        this.state.formFields["currency_id"] = res.data.dataList[0].currency_id;
        this.state.formFields["preparedBy"] = res.data.dataList[0].in_charge;
        this.state.formFields["remarks"] = res.data.dataList[0].remarks;
        this.updateState(this.state.formFields);
        console.log("this.state.formFields", this.state.formFields);
      });
  };

  handleItemDetailsSubmit = (resQuo) => {
    let { storedItemListStored, formFieldsDetailsStored, itemListBeforeEdit } =
      this.state;
    const formDataDetails = new FormData();

    formDataDetails.append(
      "q_shipcost",
      formFieldsDetailsStored.q_shipcost
        ? formFieldsDetailsStored.q_shipcost
        : 0
    );
    formDataDetails.append(
      "q_discount",
      formFieldsDetailsStored.q_discount
        ? formFieldsDetailsStored.q_discount
        : 0
    );
    formDataDetails.append(
      "q_taxes",
      formFieldsDetailsStored.q_taxes ? formFieldsDetailsStored.q_taxes : 0
    );
    formDataDetails.append(
      "q_total",
      formFieldsDetailsStored.q_total ? formFieldsDetailsStored.q_total : 0
    );

    formDataDetails.append(
      "q_discpercent",
      formFieldsDetailsStored.q_discpercent ? formFieldsDetailsStored.q_discpercent : 0
    );
    this.props
      .getCommonApi(`manualinvoicedetail/?searchqdetailid=${resQuo.data.id}`)
      .then((resGetDetails) => {
        if (resGetDetails.status == 200) {
          console.log("resGetDetails", resGetDetails);
          this.props
            .commonUpdateApi(
              `manualinvoicedetail/${resGetDetails.data[0].id}/`,
              formDataDetails
            )
            .then((resUpdateDetails) => {
              console.log("resUpdateDetails", resUpdateDetails);
              history.push(`/admin/quantum`);
            });
        } else if (resGetDetails.status == 204) {
          formDataDetails.append("fk_manualinvoice", resQuo.data.id);
          this.props
            .commonCreateApi(`manualinvoicedetail/`, formDataDetails)
            .then((resCreateDetails) => {
              console.log("resCreateDetails", resCreateDetails);
              history.push(`/admin/quantum`);
            });
        }
      });

    for (let item of itemListBeforeEdit) {
      let found = storedItemListStored.some(
        (el) => el.item_code === item.item_code
      );
      if (!found) {
        this.props
          .commonDeleteApi(`manualinvoiceitem/${item.item_id}/`)
          .then((res) => {});
      }
    }

    for (let item of storedItemListStored) {
      const formDataItem = new FormData();
      formDataItem.append("quotation_itemcode", item.item_code);
      formDataItem.append("quotation_itemdesc", item.item_desc);
      formDataItem.append("quotation_itemremarks", item.item_remarks);
      formDataItem.append("quotation_unitprice", item.item_price);
      formDataItem.append("quotation_quantity", item.item_quantity);
      formDataItem.append("discount_amt", item.discount_amt);
      formDataItem.append("discount_percent", item.discount_percent);


      this.props
        .getCommonApi(
          `manualinvoiceitem/?searchqitemid=${resQuo.data.id}&searchqitemcode=${item.item_code}`
        )
        .then((resGetItem) => {
          if (resGetItem.status == 200) {
            console.log("resGetItem", resGetItem);
            this.props
              .commonUpdateApi(
                `manualinvoiceitem/${resGetItem.data.dataList[0].id}/`,
                formDataItem
              )
              .then((resUpdateItem) => {
                console.log("resUpdateItem", resUpdateItem);
              });
          } else if (resGetItem.status == 204) {
            formDataItem.append("fk_manualinvoice", resQuo.data.id);
            this.props
              .commonCreateApi(`manualinvoiceitem/`, formDataItem)
              .then((resCreateItem) => {
                console.log("resCreateItem", resCreateItem);
              });
          }
        });
    }
  };

  handleAddressSubmit = (resQuo) => {
    let { cityOption, countryOption, stateOption } = this.state;
    //submit address
    const formDataAddress = new FormData();
    console.log(
      "this.state.formFieldsBillingStored in handleAddressSubmit",
      this.state.formFieldsBillingStored
    );
    console.log(
      "this.state.formFieldsBillingStored.to",
      this.state.formFieldsBillingStored.to
    );
    console.log(
      "this.state.formFieldsBillingStored.address1",
      this.state.formFieldsBillingStored.address1
    );
    formDataAddress.append(
      "billto",
      this.state.formFieldsBillingStored.to
        ? this.state.formFieldsBillingStored.to
        : ""
    );
    formDataAddress.append(
      "bill_addr1",
      this.state.formFieldsBillingStored.address1
        ? this.state.formFieldsBillingStored.address1
        : ""
    );
    formDataAddress.append(
      "bill_addr2",
      this.state.formFieldsBillingStored.address2
        ? this.state.formFieldsBillingStored.address2
        : ""
    );
    formDataAddress.append(
      "bill_addr3",
      this.state.formFieldsBillingStored.address3
        ? this.state.formFieldsBillingStored.address3
        : ""
    );
    formDataAddress.append(
      "bill_postalcode",
      this.state.formFieldsBillingStored.postalCode
        ? this.state.formFieldsBillingStored.postalCode
        : ""
    );

    // console.log("cityOption.find(option => option.value === this.formFieldsBillingStored.city).label",cityOption.find(option => option.value === parseInt(this.state.formFieldsBillingStored.city)).label)

    formDataAddress.append(
      "bill_city",
      this.state.formFieldsBillingStored.city
        ? cityOption.find(
            (option) =>
              option.value === parseInt(this.state.formFieldsBillingStored.city)
          ).label
        : ""
    );

    formDataAddress.append(
      "bill_state",
      this.state.formFieldsBillingStored.state
        ? stateOption.find(
            (option) =>
              option.value ===
              parseInt(this.state.formFieldsBillingStored.state)
          ).label
        : ""
    );

    formDataAddress.append(
      "bill_country",
      this.state.formFieldsBillingStored.country
        ? countryOption.find(
            (option) =>
              option.value ===
              parseInt(this.state.formFieldsBillingStored.country)
          ).label
        : ""
    );
    // console.log("countryOption.find(option => option.value === parseInt(this.state.formFieldsBillingStored.country)).label",countryOption.find(option => option.value === parseInt(this.state.formFieldsBillingStored.country)).label)

    formDataAddress.append(
      "shipto",
      this.state.formFieldsShippingStored.to
        ? this.state.formFieldsShippingStored.to
        : ""
    );
    formDataAddress.append(
      "ship_addr1",
      this.state.formFieldsShippingStored.address1
        ? this.state.formFieldsShippingStored.address1
        : ""
    );
    formDataAddress.append(
      "ship_addr2",
      this.state.formFieldsShippingStored.address2
        ? this.state.formFieldsShippingStored.address2
        : ""
    );
    formDataAddress.append(
      "ship_addr3",
      this.state.formFieldsShippingStored.address3
        ? this.state.formFieldsShippingStored.address3
        : ""
    );
    formDataAddress.append(
      "ship_postalcode",
      this.state.formFieldsShippingStored.postalCode
        ? this.state.formFieldsShippingStored.postalCode
        : ""
    );

    formDataAddress.append(
      "ship_city",
      this.state.formFieldsShippingStored.city
        ? cityOption.find(
            (option) =>
              option.value ===
              parseInt(this.state.formFieldsShippingStored.city)
          ).label
        : ""
    );

    formDataAddress.append(
      "ship_state",
      this.state.formFieldsShippingStored.state
        ? stateOption.find(
            (option) =>
              option.value ===
              parseInt(this.state.formFieldsShippingStored.state)
          ).label
        : ""
    );

    formDataAddress.append(
      "ship_country",
      this.state.formFieldsShippingStored.country
        ? countryOption.find(
            (option) =>
              option.value ===
              parseInt(this.state.formFieldsShippingStored.country)
          ).label
        : ""
    );

    this.props
      .getCommonApi(`manualinvoiceaddr/?searchqaddrid=${resQuo.data.id}`)
      .then((resGetAddr) => {
        if (resGetAddr.status == 200) {
          console.log("resGetAddr", resGetAddr);
          this.props
            .commonUpdateApi(
              `manualinvoiceaddr/${resGetAddr.data[0].id}/`,
              formDataAddress
            )
            .then((resUpdateAddr) => {
              console.log("resCreateAddr", resUpdateAddr);
            });
        } else if (resGetAddr.status == 204) {
          formDataAddress.append("fk_manualinvoice", resQuo.data.id);
          this.props
            .commonCreateApi(`manualinvoiceaddr/`, formDataAddress)
            .then((resCreateAddr) => {
              console.log("resCreateAddr", resCreateAddr);
            });
        }
      });
  };

  handleSubmit = async (status) => {
    try {
      if (this.validator.allValid()) {
        let { formFields, statusOption } = this.state;
        let statusValue = "";
        console.log("formFields.status", formFields.status);

        for (let key of statusOption) {
          // console.log(key.value)
          if (key.value == formFields.status) {
            statusValue = key.label;
          }
        }
        console.log("statusValue", statusValue);
        const formData = new FormData();
        formData.append("manualinv_number", formFields.fk_manualinvoice);
        formData.append("title", formFields.projectTitle);
        formData.append("company", formFields.companyName);
        formData.append(
          "created_at",
          dateFormat(formFields.quoDate) + " 00:00:00"
        );
        // formData.append("created_at", dateFormat(formFields.quoDate) + " "+formFields.quoDate.getHours() + ":" + formFields.quoDate.getMinutes() + ":" + formFields.quoDate.getSeconds());
        formData.append("validity", formFields.validity);
        formData.append("contact_person", formFields.attnTo);
        formData.append("cust_id", this.state.cust_id);
        
        //check save or post
        if (status) {
          formData.append("status", "Posted");
        } else {
          formData.append("status", statusValue);
        }
        formData.append("currency_id", formFields.currency_id);
        formData.append("in_charge", formFields.preparedBy);
        formData.append("remarks", formFields.remarks);
        formData.append("username", this.props.tokenDetail.username);
        if (this.state.fkProject) {
          formData.append("fk_project", this.state.fkProject);
        }
        console.log("this.state.fkProject in updating", this.state.fkProject);

        console.log("formData", formData);
        console.log("this.props.match.params.id", this.props.match.params.id);
        if (this.props.match.params.id) {
          console.log("in if loop");
          console.log("this.props.match.params.id", this.props.match.params.id);
          var resQuo = await this.props.updateManualinvoice(
            `${this.props.match.params.id}/`,
            formData
          );

          console.log(resQuo, "resquo");
          await this.handleAddressSubmit(resQuo);
          await this.handleItemDetailsSubmit(resQuo);
          if (statusValue == "Void") {
            console.log("if void loop");
            await this.props.deleteManualinvoice(
              `${this.props.match.params.id}/`
            );
          }

          // await this.props.history.push(
          //   `/admin/quotation`
          // )
        } else {
          console.log("pass if loop");
          console.log("this.props.location.state", this.props.location.state);
          // if (this.props.location.state){
          //   console.log("this.props.location.state.projectFk",this.props.location.state.projectFk)
          //   formData.append("fk_project", this.props.location.state.projectFk);
          // }
          console.log("pass if ?");

          console.log(
            "this.state.fkProject before createPO",
            this.state.fkProject
          );
          console.log("this.state.fkProject", this.state.fkProject);

          var resQuo = await this.props.createManualinvoice(formData);
          console.log("resQuo in createQuotation", resQuo);
          console.log("resQuo.data.id", resQuo.data.id);
          for(let value of this.state.paymentScheduleAndTerms){
            this.addPaymentSchedule(resQuo.data.id,value)
          }                   
          await this.handleAddressSubmit(resQuo);
          await this.handleItemDetailsSubmit(resQuo);

          // await this.props.history.push(
          //   `/admin/quotation`
          // )
        }
      } else {
        this.validator.showMessages();
      }
      // this.updateState({ is_loading: false });
    } catch (e) {
      this.updateState({ is_loading: false });
    }
  };

  addPaymentScheduleToList=(value)=>{
    let { paymentScheduleAndTerms, formFields } = this.state;
                          paymentScheduleAndTerms.push(value);
                          this.setState({ paymentScheduleAndTerms });
                          formFields.paymentSchedule = ""; formFields.paymentTerms = "";
                          this.setState({ formFields })
  }
  
  addPaymentSchedule=async (quotationId,value)=>{
    const formDataPaymentSchedule = new FormData();
            formDataPaymentSchedule.append("payment_schedule",value.paymentSchedule);          
            formDataPaymentSchedule.append("payment_term",value.paymentTerms);
            formDataPaymentSchedule.append("active","active");          
            formDataPaymentSchedule.append("fk_manualinvoice",quotationId); 
           return this.props.addManualPaymentSchedule(formDataPaymentSchedule)
           
  }
  handlePrintPdfFormat = (url) => {
    this.setState({
      isPrintPdfClick: false,
    });
    //var a = document.createElement("a");
    //a.setAttribute("download", `${new Date()}.pdf`);
    //a.setAttribute("href", url);
    //a.click();
    window.open(url);
  };

  render() {
    let {
      formFields,
      statusOption,
      currentValue,
      navLinks,
      disableEdit,
      isPrintPdfClick,
      printData,
      currencyOption
    } = this.state;

    let {
      fk_manualinvoice,
      projectTitle,
      companyName,
      quoDate,
      validity,
      attnTo,
      status,
      currency_id,
      preparedBy,
      remarks,      
      contactPerson,
      paymentTerms,
      paymentSchedule
    } = formFields;

    let { t } = this.props;
    return (
      <div className="px-5 container create-quotation">
        <div className="head-label-nav">
          <p
            className="category"
            onClick={() => {
              if (
                window.confirm(
                  "Are you sure you want to leave this page and discard changes?"
                )
              )
                history.push(`/admin/quantum`);
            }}
          >
            {t("Manual Invoice")}
          </p>
          <i className="icon-right mx-md-3"></i>
          <p className="sub-category">
            {t(`${this.props.match.params.id ? "Edit" : "New"} invoice`)}
          </p>
        </div>
        <div className="quotation-detail">
          <div className="form-group mb-4 pb-2">
            <div className="row mt-5">
              <div className="col-md-4 col-12">
                <label className="text-left text-black common-label-text fs-17 pt-3">
                  {t("Invoice No")}
                </label>
                <div className="input-group-normal">
                  <NormalInput
                    disabled={true}
                    placeholder="Auto generated"
                    value={fk_manualinvoice}
                    name="fk_manualinvoice"
                    onChange={this.handleChange}
                  />
                </div>

                <label className="text-left text-black common-label-text fs-17 pt-3">
                  {t("Project")}
                </label>
                <div className="input-group-normal">
                  <NormalInput
                    disabled={disableEdit}
                    placeholder="Enter here"
                    value={projectTitle}
                    name="projectTitle"
                    onChange={this.handleSearch}
                    onClick={this.handleSearchClick}                    
                  />
                </div>
                {this.state.visible?(
              <div className="projectSearch-block" >
                <div className="d-flex mt-3 table table-header w-100 m-0">
                  <div className="col-6">{t("Project")}</div>
                  <div className="col-6">{t("Customer Name")}</div>
                  
                </div>
                <div className="response-table w-100 row">
                  {this.state.projectOption.length > 0 ? (
                    this.state.projectOption.map((item, index) => {
                      return (
                        <div
                          className="row m-0 table-body w-100 border"
                          onClick={() => this.handleSelectProject(item)
                          }
                          key={index}
                        >
                          <div className="col-6">{item.title}</div>
                          <div className="col-6">{item.customer_name}</div>
                          
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center w-100">
                      {t("No Data Available")}
                    </div>
                  )}
                </div>
                </div>):''}
                <div>
                  {this.validator.message(
                    t("Project"),
                    projectTitle,
                    t("required")
                  )}
                </div>

                <label className="text-left text-black common-label-text fs-17 pt-3">
                  {t("Company Name")}
                </label>
                <div className="input-group-normal">
                  <NormalInput
                    disabled={true}
                    placeholder="Enter here"
                    value={companyName}
                    name="companyName"
                    onChange={this.handleCustomerSearch}
                    onClick={this.handleCustomerSearchClick}
                  />
                </div>
                {this.state.visibleCustomer? (
              <div className="customerSearch-block">
                <div className="d-flex mt-3 table table-header w-100 m-0">
                  <div className="col-2">{t("Name")}</div>
                  <div className="col-2">{t("Phone")}</div>
                  <div className="col-2">{t("Customer Code")}</div>
                  <div className="col-2">{t("Reference")}</div>
                  <div className="col-3">{t("Email")}</div>
                  <div className="col-1">{t("NRIC")}</div>
                </div>
                <div className="response-table w-100 row">
                  {this.state.customerOption.length > 0 ? (
                   this.state. customerOption.map((item, index) => {
                      return (
                        <div
                          className="row m-0 table-body w-100 border"
                          onClick={() => this.handleSelectCustomer(item)
                          }
                          key={index}
                        >
                          <div className="col-2">{item.cust_name}</div>
                          <div className="col-2">{item.cust_phone1}</div>
                          <div className="col-2">{item.cust_code}</div>
                          <div className="col-2">{item.cust_refer}</div>
                          <div className="col-3">{item.cust_email}</div>
                          <div className="col-1">{item.cust_nric}</div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center w-100">
                      {t("No Data Available")}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
                <div>
                  {this.validator.message(
                    t("Company Name"),
                    companyName,
                    t("required")
                  )}
                </div>
              </div>

              <div className="col-md-4 col-12">
                <label className="text-left text-black common-label-text fs-17 pt-3">
                  {t("Invoice Date")}
                </label>
                <div className="input-group-normal">
                  <NormalDateTime
                    onChange={this.handleDatePick}
                    inputcol="p-0 inTime"
                    value={quoDate ? new Date(quoDate) : new Date()}
                    name="quoDate"
                    //className="dob-pick"
                    showYearDropdown={true}
                    dateFormat="dd/MM/yyyy"
                    // maxDate={new Date(toDate)}
                    showDisabledMonthNavigation
                  />
                </div>
                <div>
                  {this.validator.message(
                    t("Invoice Date"),
                    quoDate,
                    t("required")
                  )}
                </div>

                <label className="text-left text-black common-label-text fs-17 pt-3">
                  {t("Validity")}
                </label>
                <div className="input-group-normal">
                  <NormalInput
                    placeholder="Enter here"
                    disabled={disableEdit}
                    value={validity}
                    name="validity"
                    onChange={this.handleChange}
                  />
                </div>
                <div>
                  {this.validator.message(
                    t("Validity"),
                    validity,
                    t("required")
                  )}
                </div>

                <label className="text-left text-black common-label-text fs-17 pt-3">
                  {t("Attn To")}
                </label>
                <div className="input-group-normal">
                {!contactPerson.length>0?
                  <NormalInput
                  placeholder="Enter here"
                  disabled={disableEdit}
                  value={attnTo}
                  name="attnTo"
                  onChange={this.handleChange}
                  />:<NormalSelect
                  options={contactPerson.map(x=>{return{id:x.name,value:x.name,label:x.name}})}
                  disabled={disableEdit}
                  value={attnTo}
                  name="attnTo"
                  onChange={(event)=>{let formFields=this.state.formFields; formFields.attnTo=event.target.value;this.setState({formFields})}}
                />
                
                }
                </div>
                <div>
                  {this.validator.message(t("Attn To"), attnTo, t("required"))}
                </div>
              </div>

              <div className="col-md-4 col-12">
                <label className="text-left text-black common-label-text fs-17 pt-3">
                  {t("Status")}
                </label>
                <div className="input-group-normal">
                  <NormalSelect
                    options={statusOption}
                    value={status}
                    name="status"
                    onChange={this.handleChange}
                  />
                </div>
                <div>
                  {this.validator.message(t("Status"), status, t("required"))}
                </div>

                <label className="text-left text-black common-label-text fs-17 pt-3">
                  {t("Currency")}
                </label>
                <div className="input-group-normal">
                <NormalSelect
                    disabled={disableEdit}
                    options={currencyOption}
                    value={currency_id}
                    name="currency_id"
                    onChange={this.handleChange}
                  />
                </div>
                <div>
                  {this.validator.message(t("Currency"), currency_id, t("required"))}
                </div>

                <label className="text-left text-black common-label-text fs-17 pt-3">
                  {t("Prepared By")}
                </label>
                <div className="input-group-normal">
                  <NormalInput
                    placeholder="Enter here"
                    disabled={disableEdit}
                    value={preparedBy}
                    name="preparedBy"
                    onChange={this.handleChange}
                  />
                </div>
                <div>
                  {this.validator.message(
                    t("Prepared By"),
                    preparedBy,
                    t("required")
                  )}
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 col-12">
                <label className="text-left text-black common-label-text fs-17 pt-3">
                  {t("Remarks")}
                </label>
                <div className="input-group-desc">
                  <NormalTextarea
                    placeholder="Enter here"
                    disabled={disableEdit}
                    value={remarks}
                    name="remarks"
                    onChange={this.handleChange}
                  />
                </div>
              </div>

            </div>

            <div className="row">
              <div className="col-md-5 col-12">
                <label className="text-left text-black common-label-text fs-17 pt-3">
                  {t("Payment Schedule")}
                </label>
                <div className="input-group">
                  <NormalInput
                    placeholder="Enter here"
                    disabled={disableEdit}
                    value={paymentSchedule}
                    name="paymentSchedule"
                    onChange={this.handleChange}
                  />
                </div>
              </div>
              <div className="col-md-5 col-12">
                <label className="text-left text-black common-label-text fs-17 pt-3">
                  {t("Payment Terms")}
                </label>
                <div className="input-group">
                  <NormalInput
                    placeholder="Enter here"
                    disabled={disableEdit}
                    value={paymentTerms}
                    name="paymentTerms"
                    onChange={this.handleChange}
                  />
                </div>
              </div>
              <div className="col-md-2 col-12"> 
              <label className="text-left text-black common-label-text fs-17 pt-3">
                 &nbsp;
                </label>              
                <div className="input-group">
                <NormalButton
                  buttonClass={"mx-2"}
                  mainbg={true}
                  className="confirm"
                  label="Add"
                  onClick={() => 
                  {
                    if (paymentSchedule.trim().length > 0 && paymentTerms.trim().length > 0) {
                      
                      let value = { paymentSchedule: paymentSchedule, paymentTerms: paymentTerms, id: 0 };
                      if (this.props.match.params.id) {
                        this.addPaymentSchedule(this.props.match.params.id, value).then(res => {
                          value.id = res.data.id;
                          this.addPaymentScheduleToList(value);
                        })

                      } else {
                        this.addPaymentScheduleToList(value);
                      }


                    }
                  }
                    }
                  />
                  
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-10 col-12" style={{"marginLeft": "-1rem"}}>
            {this.state.paymentScheduleAndTerms.length>0 ? <table className="table">
                          <thead>
                            <tr>
                              <th className="first-value"></th>
                              <th>Payment Schedule</th>
                              <th>Payment Terms</th>                              
                            </tr>
                          </thead>
                          <tbody>
                            {this.state.paymentScheduleAndTerms.map((e, index) => {
                              return(
                              <tr key={index}>
                                <td> <img onClick={()=>{let {paymentScheduleAndTerms}= this.state;paymentScheduleAndTerms.splice(index,1);this.setState({paymentScheduleAndTerms}); if(this.props.match.params.id)this.props.removeManualPaymentSchedule(`${e.id}/`)}} className="close" src={closeIcon} alt="" /> </td>
                                <td>{e.paymentSchedule}</td>
                                <td>{e.paymentTerms}</td>
                              </tr>)
                            })}

                          </tbody>
                        </table>:""
                      }
                      </div>
            </div>
            <div className="col-md-12 quotation-content">
              <div className="tab-menus">
                <ul>
                  {navLinks.map(({ to, label, id }, index) => (
                    <li key={index}>
                      <NavLink to={to} className="nav-link">
                        <div
                          className={`sidebar-menu ${
                            currentValue === index ? "active" : ""
                          }`}
                          onClick={() =>
                            this.handleClick({ key: index, id: id })
                          }
                        >
                          <span className="sidebar-menu-desc">{t(label)}</span>
                        </div>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
              {this.state.selectedMenu === "Details" && (
                <Details
                  custId={this.state.cust_id}
                  disableEdit={disableEdit}
                  quoId={this.props.match.params.id}
                  siteGstList={this.state.siteGstList}
                  validator={this.validator}
                  storeItemDetails={this.storeItemDetails.bind(this)}
                  storedItemListStored={this.state.storedItemListStored}
                  formFieldsDetailsStored={this.state.formFieldsDetailsStored}
                  id={this.state.selectedMenu}
                  // search={formFields.search}
                  api={"details"}
                />
              )}
              {this.state.selectedMenu === "Address" && (
                <Address
                  disableEdit={disableEdit}
                  storeAddressFields={this.storeAddressFields.bind(this)}
                  formFieldsBillingStored={this.state.formFieldsBillingStored}
                  formFieldsShippingStored={this.state.formFieldsShippingStored}
                  id={this.state.selectedMenu}
                  // search={formFields.search}
                  api={"address"}
                />
              )}
            </div>

            <div className="row">
              {/* <div className="col-md-2 col-12 mt-3"></div> */}

              <div className="col-md-2 col-12 mt-3">
                <NormalButton
                  buttonClass={"mx-2 mb-3"}
                  mainbg={true}
                  className="confirm"
                  label="Cancel"
                  outline={false}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to leave this page and discard changes?"
                      )
                    )
                      history.push(`/admin/quantum`);
                  }}
                />
              </div>

              <div className="col-md-2 col-12 mt-3">
                <NormalButton
                  disabled={this.state.storedItemListStored.length<1}
                  buttonClass={"mx-2"}
                  mainbg={true}
                  className="confirm"
                  label="Save"
                  onClick={() => this.handleSubmit()}
                />
              </div>

              <div className="col-md-2 col-12 mt-3">
                <NormalButton
                  buttonClass={"mx-2 mb-3"}
                  mainbg={true}
                  className="confirm"
                  label="Post"
                  outline={false}
                  onClick={() => this.handleSubmit(status)}
                />
              </div>
              {this.props.match.params.id && (
                <div className="col-md-2 col-12 mt-3">
                  <NormalButton
                    buttonClass={"print"}
                    mainbg={true}
                    className="col-12 fs-15 "
                    label="Print"
                    // outline={false}
                    onClick={ () => {this.props.history.push({
                      pathname: `/admin/quantum/manualinvoice/print/${this.props.match.params.id}`,
                    
                    })}}
                  />

                  {isPrintPdfClick ? (
                    <PDFDownloadLink
                      document={
                        <Invoice
                          TableList={printData}
                          accountHeader={printData["company_header"]}
                          Flag={7}
                          landscape={false}
                        />
                      }
                    >
                      {({ blob, url, loading, error }) =>
                        !loading && url ? this.handlePrintPdfFormat(url) : null
                      }
                    </PDFDownloadLink>
                  ) : null}
                </div>
              )}
              {disableEdit == true ? (
                <div className="col-md-2 col-12 mt-3">
                  <NormalButton
                    buttonClass={"mx-2"}
                    mainbg={true}
                    className="confirm"
                    label="Convert to PO"
                    onClick={() =>
                      this.props.history.push({
                        pathname: "/admin/quantum/po/add",
                        state: {
                          quoId: this.props.match.params.id,
                          projectFk: this.state.fkProject,
                        },
                      })
                    }
                  />
                </div>
              ) : null}
              {disableEdit == true ? (
                <div className="col-md-2 col-12 mt-3">
                  <NormalButton
                    buttonClass={"mx-2"}
                    mainbg={true}
                    className="confirm"
                    label="Import to Xero"
                    onClick={() =>
                      importInvoiceToXero(
                        this.state.storedItemListStored,
                        this.state.formFields
                      )
                    }
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
        {/* )} */}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  tokenDetail: state.authStore.tokenDetails,
});

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators(
    {
      getCommonApi,
      commonCreateApi,
      commonUpdateApi,
      createManualinvoice,
      updateManualinvoice,
      deleteManualinvoice,
      commonDeleteApi,
      getTokenDetails,
      addManualPaymentSchedule,
      removeManualPaymentSchedule
    },
    dispatch
  );
};

export const ManualAddQuotation = withTranslation()(
  connect(mapStateToProps, mapDispatchToProps)(ManualAddQuotationClass)
);
