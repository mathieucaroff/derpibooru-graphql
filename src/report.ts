type Report = (param: {
    invalidFieldNameInfo: any[];
    exceptionObject: ExceptionObject;
    inputExceptionObject: ExceptionObject;
    ignoredFilterTypeInfo: any[];
}) => void;

export class ExceptionObject {
    compoundNameFieldSet: Set<string>;
    ignoredFieldSet: Set<string>;
    ignoredModelSet: Set<string>;
    constructor() {
        this.compoundNameFieldSet = new Set();
        this.ignoredFieldSet = new Set();
        this.ignoredModelSet = new Set();
    }
    report(name: string, c: string) {
        const { compoundNameFieldSet, ignoredModelSet, ignoredFieldSet } = this;
        console.log(
            `[modelMap2TypeMap][${name}] skipping (${compoundNameFieldSet.size}) fields with compound names.`,
        );

        // T: Types //
        console.log(
            `[modelMap2TypeMap][${name}] skipping (${ignoredModelSet.size}) empty types:`,
        );
        console.log(
            `These (${ignoredModelSet.size}) types are:`,
            `\nT${c}: ${[...ignoredModelSet].sort().join(`\nT${c}: `)}`,
        );

        // !: Fields //
        console.log(
            `[modelMap2TypeMap][${name}] skipping (${ignoredFieldSet.size}) fields of unknown type:`,
        );
        console.log(
            `These (${ignoredFieldSet.size}) fields are:`,
            '\n```graphql',
            '\nTYPENAME {',
            '\n  FIELDNAME: FIELDTYPE',
            '\n}',
            '\n```',
            `\n!${c}: { FIELDTYPE :FIELDNAME } TYPENAME`,
            `\n!${c}: ${[...ignoredFieldSet].sort().join(`\n!${c}: `)}`,
        );
    }
}

export const report: Report = ({
    exceptionObject,
    inputExceptionObject,
    invalidFieldNameInfo,
    ignoredFilterTypeInfo,
}) => {
    console.log(`[modelMap2TypeMap] skipping [${invalidFieldNameInfo}]`);

    exceptionObject.report('resp', '>');
    // inputExceptionObject.report('input', '<');

    // $: Filters //
    const reportFilter = false;
    if (reportFilter) {
        console.log(
            `[modelMap2TypeMap] (${ignoredFilterTypeInfo.length}) unrecognized filter types have been changed to "string". These are:`,
        );
        const lineList = ignoredFilterTypeInfo.map((info) => {
            const { dataType, filterName, fieldName } = info;
            return `(${dataType} :${filterName}) ${fieldName}`;
        });
        console.log(
            `These (${ignoredFilterTypeInfo.length}) fields are:`,
            '\n```graphql',
            '\nFIELDNAME(',
            '\n  FILTERNAME: FILTERTYPE',
            '\n)',
            '\n```',
            `\n$: (FILTERTYPE :FILTERNAME) FIELDNAME`,
            `\n$: ${lineList.join('\n$: ')}`,
        );
    }
};
