import React from "react";
import { Toast } from "service/toast";
import "./style.scss";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { getCommonApi } from "redux/actions/common";
import {
  NormalButton,
  NormalDate,
  TableWrapper,
  InputSearch,
} from "component/common";
import { dateFormat } from "service/helperFunctions";
import { withTranslation } from "react-i18next";
import { NormalInput, NormalDateTime } from "component/common";
import { Link } from "react-router-dom";
import _ from "lodash";
import updateBtn from "../../../../assets/images/edit1.png";
import deleteBtn from "../../../../assets/images/delete1.png";
import closeBtn from "../../../../assets/images/close.png";
import saveBtn from "../../../../assets/images/save.png";

export class DetailsClass extends React.Component {
  state = {
    headerDetails: [
      { label: "Item Code" },
      { label: "Item Description" },
      { label: "Unit Price" },
      { label: "Quantity" },
      { label: "" },
    ],
    headerSelectedDetails: [
      { label: "Item Code" },
      { label: "Item Description" },
      { label: "Remarks" },
      { label: "Unit Price" },
      { label: "Quantity" },
      { label: "" },
      { label: "" },
    ],
    formFields: {
      po_shipcost: "",
      po_discount: "",
      po_taxes: "",
      po_total: "",
    },

    detailsList: [],
    storedItemList: [],
    pageMeta: {},

    siteGstList: [],

    search: "",
    active: false,
    currentIndex: -1,
    page: 1,
    // limit: 10,
    limit: 4,
    isOpenvoidCheckout: false,
    isLoading: true,
    // is_loading: false,
    isMounted: true,

    // salesCollectionHeader: [
    //   { label: "Sales Collection" },
    //   { label: "Before Tax" },
    //   { label: "Amount" },
    //   { label: "Qty" },
    // ],
    // nonSalesCollectionHeader: [
    //   { label: "Non Sales Collection" },
    //   { label: "Amount" },
    //   { label: "Qty" },
    // ],
    // deptSalesHeader: [{ label: "Dept Sales" }, { label: "Amount" }],
    // salesTransactionHeader: [
    //   { label: "Sales Transaction" },
    //   { label: "Amount" },
    //   { label: "Paid" },
    //   { label: "Outstanding" },
    // ],
    // ARTransactionHeader: [{ label: "AR Transaction" }, { label: "Amount" }],
    // TreatmentDoneHeader: [
    //   { label: "Customer" },
    //   { label: "Customer Reference" },
    //   { label: "Treatment Done" },
    //   { label: "Description" },
    //   { label: "Staff" },
    //   { label: "Amount" },
    // DayDate: new Date(),
    // runDayEnd: false,
    // reportDate: "",
    // sales_collec: null,
    // sales_trasac: null,
    // ar_trasac: null,
    // treatment_done: null,
    // dept_sales: null,
  };

  componentWillMount() {
    this.autofillSaved();
  }

  updateState = data => {
    if (this.state.isMounted) this.setState(data);
  };

  componentDidMount() {
    // let From = new Date();
    // let { formField } = this.state;
    // let firstdayMonth = new Date(From.getFullYear(), From.getMonth(), 1);
    // formField["fromDate"] = firstdayMonth;
    // this.setState({
    //   formField,
    // });

    this.getDetails();
    if (this.props.poId) {
      this.autofillDetails();
    }
    if (this.props.quoId) {
      this.autofillDetailsFromQuo();
      console.log("this.props.quoId", this.props.quoId);
    }
    console.log("this.props in comdidmount", this.props);
    // this.queryHandler({});
    console.log(
      "this.props.storedItemListStored loaded",
      this.props.storedItemListStored
    );
    console.log(
      "this.props.formFieldsDetailsStored loaded",
      this.props.formFieldsDetailsStored
    );
  }

  componentDidUpdate(prevProps) {
    // Typical usage (don't forget to compare props):
    if (this.props.siteGstList !== prevProps.siteGstList) {
      // this.fetchData(this.props.siteGstList);
      let { siteGstList } = this.state;
      console.log("this.props.siteGstList in update", this.props.siteGstList);
      siteGstList = this.props.siteGstList;
      this.setState({ siteGstList }, () => {
        this.handleUpdateTotal();
      });
      // this.handleUpdateTotal()
    }
  }

  autofillDetailsFromQuo = () => {
    let formFields = Object.assign({}, this.state.formFields);
    let { storedItemList } = this.state;
    this.props
      .getCommonApi(`quotationdetail/?searchqdetailid=${this.props.quoId}`)
      .then(res => {
        console.log("res in autofillDetailsFromQuo", res);

        if (res.status == 200) {
          formFields["po_shipcost"] = res.data[0].q_shipcost;
          formFields["po_discount"] = res.data[0].q_discount;
          formFields["po_taxes"] = res.data[0].q_taxes;
          formFields["po_total"] = res.data[0].q_total;

          // this.state.formFieldsDetailsStored.push("q_shipcost":res.data[0].q_shipcost)
          this.updateState({
            formFields,
          });
          this.props.storeItemDetails(storedItemList, formFields);
          // this.setState(this.state.formFields)
        }
        console.log(
          "formFields in autofillDetailsFromQuo",
          this.state.formFields
        );
      });
  };

  autofillDetails = () => {
    let formFields = Object.assign({}, this.state.formFields);
    // formFields["q_shipcost"] = 12
    // this.updateState({
    //   formFields,
    // });
    this.props
      .getCommonApi(`podetail/?searchpodetailid=${this.props.poId}`)
      .then(res => {
        console.log("res in getAutofillItemDetails", res);
        if (res.status == 200) {
          formFields["po_shipcost"] = res.data[0].po_shipcost;
          formFields["po_discount"] = res.data[0].po_discount;
          formFields["po_taxes"] = res.data[0].po_taxes;
          formFields["po_total"] = res.data[0].po_total;
          // this.state.formFieldsDetailsStored.push("q_shipcost":res.data[0].q_shipcost)
          this.updateState({
            formFields,
          });
          console.log(
            "this.state.formFields in componentWillMount",
            this.state.formFields
          );
        }
      });
  };

  getDetails = () => {
    this.updateState({ isLoading: true });
    let { detailsList, pageMeta, page, limit, search } = this.state;
    // let { item_desc } = formField;

    this.props
      .getCommonApi(
        `qpoitem/?searchitemdesc=${search}&page=${page}&limit=${limit}`
      )
      .then(async res => {
        console.log(res, "dsfdfaafg");
        await this.setState({ detailsList: [] });
        detailsList = res.data.dataList;
        // pageMeta = res.data.meta.pagination;
        pageMeta = res.data.pagination;
        // pageMeta = {per_page:5, current_page:1, total:2, total_pages:4}
        // this.setState({ detailsList, pageMeta });
        // this.setState({ detailsList });

        console.log("res.data", res.data);
        console.log("detailsList", detailsList);
        console.log("pageMeta", pageMeta);
        this.updateState({
          detailsList,
          pageMeta,
          isLoading: false,
        });
      });
  };

  handlePagination = async pageNo => {
    let { page } = this.state;
    page = pageNo.page;
    await this.setState({
      page,
    });
    this.getDetails();
  };
  // pagination
  // handlePagination = page => {
  //   this.queryHandler(page);
  // };

  handlesearch = event => {
    // event.persist();
    console.log(event.target.value);
    let { search } = this.state;
    search = event.target.value;
    this.setState({ search });
    if (!this.debouncedFn) {
      this.debouncedFn = _.debounce(async () => {
        this.getDetails({});
      }, 500);
    }
    this.debouncedFn();
  };

  handleClick = key => {
    if (!this.state.active) {
      document.addEventListener("click", this.handleOutsideClick, false);
    } else {
      document.removeEventListener("click", this.handleOutsideClick, false);
    }

    this.setState(prevState => ({
      active: !prevState.active,
      currentIndex: key,
    }));
  };

  handleOutsideClick = e => {
    if (this.node != null) {
      if (this.node.contains(e.target)) {
        return;
      }
    }
    this.handleClick();
  };

  handleChangeDetails = ({ target: { value, name } }) => {
    let { storedItemList } = this.state;
    let formFields = Object.assign({}, this.state.formFields);

    formFields[name] = value;

    this.setState(
      {
        formFields,
      },
      () => {
        this.handleUpdateTotal();
      }
    );
    this.props.storeItemDetails(storedItemList, formFields);
  };

  handleChange = ({ target: { value, name } }) => {
    let { detailsList } = this.state;
    console.log("value", value);
    console.log("name", name);

    for (let list in detailsList) {
      if (detailsList[list].item_code == name) {
        detailsList[list].item_quantity = value;
      }
      console.log("detailsList[list].item_code", detailsList[list].item_code);
    }

    this.setState({
      detailsList,
    });
    console.log("detailsList in handleChange", detailsList);
    // current_item_quantity = value
    // this.setState({ current_item_quantity })
  };

  handleSelect = (item_code, item_desc, item_price, item_quantity) => {
    let { storedItemList, detailsList, formFields } = this.state;
    for (let item of storedItemList) {
      if (item.item_code == item_code) {
        Toast({
          type: "error",
          message: "This item already exists",
        });
        return;
      }
    }

    console.log("item_code", item_code);
    console.log("item_desc", item_desc);
    console.log("item_price", item_price);

    if (item_quantity) {
      storedItemList.push({
        item_code: item_code,
        item_desc: item_desc,
        item_remarks: "",
        item_price: item_price,
        item_quantity: item_quantity,
        editing: false,
      });
    } else {
      item_quantity = 1;
      storedItemList.push({
        item_code: item_code,
        item_desc: item_desc,
        item_remarks: "",
        item_price: item_price,
        item_quantity: item_quantity,
        editing: false,
      });
    }

    console.log("storedItemList", storedItemList);
    this.setState({ storedItemList });
    this.handleUpdateTotal();
    this.props.storeItemDetails(storedItemList, formFields);
  };

  handleRemoveStoredItem = item_code => {
    let { storedItemList, formFields } = this.state;
    for (var i = 0; i < storedItemList.length; i++) {
      if (storedItemList[i].item_code == item_code) {
        storedItemList.splice(i, 1);
      }
    }
    console.log("storedItemList after remove", storedItemList);
    this.setState({ storedItemList });
    this.handleUpdateTotal();
    this.props.storeItemDetails(storedItemList, formFields);
  };

  handleEdit = item_code => {
    let { storedItemList } = this.state;
    for (let list in storedItemList) {
      if (storedItemList[list].item_code == item_code) {
        storedItemList[list].editing = true;
      }
    }
    console.log("storedItemList in handleedit", storedItemList);

    this.setState({ storedItemList });
  };

  handleSave = item_code => {
    let { storedItemList, formFields } = this.state;
    for (let list in storedItemList) {
      if (storedItemList[list].item_code == item_code) {
        storedItemList[list].editing = false;
      }
    }
    console.log("storedItemList in handleedit", storedItemList);

    this.setState({ storedItemList });
    this.handleUpdateTotal();
    this.props.storeItemDetails(storedItemList, formFields);
  };

  handleEditChangeRemarks = ({ target: { value, name } }) => {
    let { storedItemList } = this.state;

    for (let list in storedItemList) {
      if (storedItemList[list].item_code == name) {
        storedItemList[list].item_remarks = value;
      }
      // console.log("storedItemList[list].item_code",storedItemList[list].item_code)
    }

    this.setState({
      storedItemList,
    });

    console.log("storedItemList in handleEditChange", storedItemList);
  };

  handleEditChangePrice = ({ target: { value, name } }) => {
    let { storedItemList } = this.state;

    for (let list in storedItemList) {
      if (storedItemList[list].item_code == name) {
        storedItemList[list].item_price = value;
      }
      // console.log("storedItemList[list].item_code",storedItemList[list].item_code)
    }

    this.setState({
      storedItemList,
    });
    console.log("storedItemList in handleEditChange", storedItemList);
  };

  handleEditChangeQuantity = ({ target: { value, name } }) => {
    let { storedItemList } = this.state;

    for (let list in storedItemList) {
      if (storedItemList[list].item_code == name) {
        storedItemList[list].item_quantity = value;
      }
      // console.log("storedItemList[list].item_code",storedItemList[list].item_code)
    }

    this.setState({
      storedItemList,
    });
    console.log("storedItemList in handleEditChange", storedItemList);
  };

  autofillSaved = () => {
    let { storedItemList, formFields } = this.state;

    storedItemList = this.props.storedItemListStored;

    formFields.po_shipcost = this.props.formFieldsDetailsStored.po_shipcost;
    formFields.po_discount = this.props.formFieldsDetailsStored.po_discount;
    formFields.po_taxes = this.props.formFieldsDetailsStored.po_taxes;
    formFields.po_total = this.props.formFieldsDetailsStored.po_total;

    this.setState({ storedItemList, formFields });
    console.log("storedItemList in autofillSaved", storedItemList);
    console.log("formFields in autofillSaved", formFields);
  };

  handleUpdateTotal = () => {
    let { storedItemList, formFields, siteGstList } = this.state;
    // console.log("siteGstList[0]",siteGstList[0].site_is_gst)
    // if(siteGstList[0].site_is_gst == false)

    if (storedItemList.length !== 0) {
      let costPrice = 0;
      let subTotal = 0;
      let taxes = 0;
      let total = 0;
      for (let item of storedItemList) {
        costPrice =
          parseFloat(item.item_price) * parseFloat(item.item_quantity) +
          costPrice;
        // console.log("item.item_price",item.item_price,typeof item.item_price)
        // console.log("item.item_quantity",item.item_quantity,typeof item.item_quantity)
        // formFields.DOC_AMT = item.amount + formFields.DOC_AMT
        // formFields.DOC_QTY = parseInt(item.item_quantity) + formFields.DOC_QTY
      }
      console.log("GST");
      console.log(
        "formFields.po_shipcost",
        formFields.po_shipcost,
        typeof formFields.po_shipcost
      );
      console.log("costPrice", costPrice);

      subTotal =
        costPrice -
        (formFields.po_discount ? parseFloat(formFields.po_discount) : 0) +
        (formFields.po_shipcost ? parseFloat(formFields.po_shipcost) : 0);
      taxes =
        Math.round((siteGstList[0].item_value / 100) * subTotal * 100) / 100;

      total = Math.round((subTotal + taxes) * 100) / 100;

      formFields.po_taxes = taxes;
      formFields.po_total = total;
      // console.log("storedItemList in update total",storedItemList)
      // formFields.DOC_AMT = Math.round(formFields.DOC_AMT * 100) / 100
      // console.log("formFields.DOC_AMT",formFields.DOC_AMT, typeof formFields.DOC_AMT)
      this.setState({ formFields });
      console.log("formFields in update total if", formFields);
    } else {
      formFields.po_taxes = 0;
      formFields.po_total = 0;
      this.setState({ formFields });
      console.log("formFields in update total else", formFields);
    }
  };

  render() {
    let {
      headerDetails,
      headerSelectedDetails,
      pageMeta,
      detailsList,
      storedItemList,
      isLoading,
      formFields,
    } = this.state;

    let { po_shipcost, po_discount, po_taxes, po_total } = formFields;

    let { t } = this.props;

    return (
      <div className="py-4">
        <div className="table-container">
          <div className="row">
            <div className="col-8"></div>

            <div className="col-4 mb-3">
              <div className="w-100">
                <InputSearch
                  placeholder="Search Item"
                  onChange={this.handlesearch}
                />
              </div>
            </div>
          </div>

          <TableWrapper
            headerDetails={headerDetails}
            queryHandler={this.handlePagination}
            pageMeta={pageMeta}
          >
            {isLoading ? (
              <tr>
                <td colSpan="7">
                  <div class="d-flex mt-5 align-items-center justify-content-center">
                    <div class="spinner-border" role="status">
                      <span class="sr-only">{t("Loading...")}</span>
                    </div>
                  </div>
                </td>
              </tr>
            ) : detailsList ? (
              detailsList.map((item, index) => {
                let { item_code, item_desc, item_price, item_quantity } = item;
                return (
                  <tr key={index}>
                    <td>
                      <div className="d-flex align-items-center justify-content-center">
                        {item_code}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center justify-content-center">
                        {item_desc}
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center justify-content-center">
                        {item_price}
                      </div>
                    </td>

                    <td>
                      {/* <div className="input-group"> */}
                      <NormalInput
                        value={item_quantity}
                        disabled={this.props.disableEdit}
                        name={item_code}
                        onChange={this.handleChange}
                      />
                      {/* </div> */}
                    </td>

                    <td>
                      <div className="d-flex align-items-center justify-content-center">
                        <NormalButton
                          buttonClass={"mx-2"}
                          disabled={this.props.disableEdit}
                          mainbg={true}
                          className="warning"
                          label="Select"
                          onClick={() =>
                            this.handleSelect(
                              item_code,
                              item_desc,
                              item_price,
                              item_quantity
                            )
                          }
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : null}
          </TableWrapper>

          <div className="row mt-5"></div>
          <TableWrapper
            headerDetails={headerSelectedDetails}
            // queryHandler={this.handlePagination}
            // pageMeta={pageMeta}
          >
            {storedItemList
              ? storedItemList.map((item, index) => {
                  let {
                    item_code,
                    item_desc,
                    item_remarks,
                    item_price,
                    item_quantity,
                    editing,
                  } = item;
                  return editing == false ? (
                    <tr key={index}>
                      <td>
                        <div className="d-flex align-items-center justify-content-center">
                          {item_code}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center justify-content-center">
                          {item_desc}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center justify-content-center">
                          {item_remarks}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center justify-content-center">
                          {item_price}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center justify-content-center">
                          {item_quantity}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center justify-content-center">
                          <img
                            src={updateBtn}
                            width="35"
                            height="35"
                            alt=""
                            className="action-img bg-transparent"
                            onClick={
                              this.props.disableEdit == false
                                ? () => this.handleEdit(item_code)
                                : ""
                            }
                          />
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center justify-content-center">
                          <img
                            src={deleteBtn}
                            width="35"
                            height="35"
                            alt=""
                            className="action-img bg-transparent "
                            onClick={
                              this.props.disableEdit == false
                                ? () => this.handleRemoveStoredItem(item_code)
                                : ""
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={index}>
                      <td>
                        <div className="d-flex align-items-center justify-content-center">
                          {item_code}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center justify-content-center">
                          {item_desc}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center justify-content-center">
                          <NormalInput
                            value={item_remarks}
                            disabled={this.props.disableEdit}
                            name={item_code}
                            onChange={this.handleEditChangeRemarks}
                          />
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center justify-content-center">
                          <NormalInput
                            value={item_price}
                            disabled={this.props.disableEdit}
                            name={item_code}
                            onChange={this.handleEditChangePrice}
                          />
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center justify-content-center">
                          <NormalInput
                            value={item_quantity}
                            disabled={this.props.disableEdit}
                            name={item_code}
                            onChange={this.handleEditChangeQuantity}
                          />
                        </div>
                      </td>
                      {/* <td>
                              <div className="d-flex align-items-center justify-content-center">
                                <img
                                  src={closeBtn}
                                  width="35"
                                  height="35"
                                  alt=""
                                  className="action-img bg-transparent"
                                  onClick={() =>this.handleClose(item_code)}
                                />
                              </div>
                            </td> */}
                      <td>
                        <div className="d-flex align-items-center justify-content-center">
                          <img
                            src={saveBtn}
                            width="35"
                            height="35"
                            alt=""
                            className="action-img bg-transparent "
                            onClick={
                              this.props.disableEdit == false
                                ? () => this.handleSave(item_code)
                                : ""
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              : null}
          </TableWrapper>

          <div className="row justify-content-end mt-5">
            <div className="col-4">
              <div className="d-flex mb-3">
                <label className="text-left w-100 text-black common-label-text fs-15 pl-5 pt-2">
                  {t("Shipping Cost")}
                </label>
                <div className="input-group-address w-100">
                  <NormalInput
                    placeholder="0"
                    disabled={this.props.disableEdit}
                    value={po_shipcost}
                    name="po_shipcost"
                    onChange={this.handleChangeDetails}
                  />
                </div>
              </div>

              <div className="d-flex mb-3">
                <label className="text-left w-100 text-black common-label-text fs-15 pl-5 pt-2">
                  {t("Discount")}
                </label>
                <div className="input-group-address w-100">
                  <NormalInput
                    placeholder="0"
                    disabled={this.props.disableEdit}
                    value={po_discount}
                    name="po_discount"
                    onChange={this.handleChangeDetails}
                  />
                </div>
              </div>

              <div className="d-flex mb-3">
                <label className="text-left w-100 text-black common-label-text fs-15 pl-5 pt-2">
                  {t("Taxes")}
                </label>
                <div className="input-group-address w-100">
                  <NormalInput
                    placeholder="0"
                    disabled={true}
                    value={po_taxes}
                    name="po_taxes"
                    // onChange={this.handleChangeDetails}
                  />
                </div>
              </div>

              <div className="d-flex mb-3">
                <label className="text-left w-100 text-black common-label-text fs-15 pl-5 pt-2">
                  {t("Total")}
                </label>
                <div className="input-group-address w-100">
                  <NormalInput
                    placeholder="0"
                    disabled={true}
                    value={po_total}
                    name="po_total"
                    // onChange={this.handleChangeDetails}
                  />
                </div>
              </div>
              <div>
                {this.props.validator.message(
                  t("Total"),
                  po_total,
                  t("required")
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// const mapStateToProps = state => ({
//   projectDetail: state.project.projectDetail,
// });

const mapDispatchToProps = dispatch => {
  return bindActionCreators(
    {
      getCommonApi,
      // deleteProject,
      // getProject
    },
    dispatch
  );
};

export const Details = withTranslation()(
  connect(null, mapDispatchToProps)(DetailsClass)
);
