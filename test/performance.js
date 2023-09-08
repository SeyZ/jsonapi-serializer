
const schemaRowCreate = {
    ref: 'id',
    attributes: ['position', 'isHidden', 'field'],
    field: {
        ref: 'id',
        attributes: [],
        included: false,
    },
};
const schemaRowEdit = {
    ref: 'id',
        attributes: ['position', 'isHidden', 'field', 'explorerConfiguration'],
    field: {
    ref: 'id',
        attributes: [],
        included: false,
},
};
const schemaColumn = {
    ref: 'id',
    attributes: ['position', 'isHidden', 'field'],
    field: {
        ref: 'id',
        included: false,
    },
};
const fieldOptions = {
    ref: 'id',
    attributes: [
        'collection',
        'column',
        'defaultValue',
        'description',
        'displayName',
        'enums',
        'field',
        'integration',
        'inverseOf',
        'isFilterable',
        'canFilter',
        'isReadOnly',
        'isRequired',
        'isVirtual',
        'mappingValues',
        'conditionalFormatting',
        'position',
        'reference',
        'relationship',
        'row',
        'type',
        'widgetDisplay',
        'widgetEdit',
        'foreignAndPrimaryKey',
        'hook',
        'isPrimaryKey',
    ],
    collection: {
        ref: 'id',
        attributes: [],
        included: false,
    },
    column: {
        ref: 'id',
        attributes: [],
        included: false,
    },
    row: {
        ref: 'id',
        attributes: [],
        included: false,
    },
};
const schemaCustomAction = {
    ref: 'id',
    attributes: [
        'allowSelfApproval',
        'approvers',
        'baseUrl',
        'buttonType',
        'collection',
        'confirmation',
        'download',
        'endpoint',
        'fields',
        'hooks',
        'httpMethod',
        'isHidden',
        'name',
        'displayName',
        'position',
        'redirect',
        'requireApproval',
        'segments',
        'type',
        'users',
        'restrictedTo',
        'approvedBy',
    ],
    collection: {
        ref: 'id',
        included: false,
    },
    segments: {
        ref: 'id',
        included: false,
    },
    users: {
        ref: 'id',
        included: false,
    },
    approvers: {
        ref: 'id',
        included: false,
    },
    fields: fieldOptions,
};
const schemaChart = {
    ref: 'id',
    attributes: [
        'name',
        'description',
        'displaySettings',
        'type',
        'dashboard',
        'viewEdit',
        'aggregator',
        'sourceCollection',
        'labelField',
        'relationshipField',
        'aggregateField',
        'groupByField',
        'filter',
        'timeRange',
        'apiRoute',
        'smartRoute',
        'numeratorChart',
        'denominatorChart',
        'query',
        'limit',
        'objective',
        's3Versions',
        'componentUrl',
        'templateUrl',
        'styleUrl',
    ],
    sourceCollection: {
        ref: 'id',
        included: false,
    },
    labelField: {
        ref: 'id',
        included: false,
    },
    relationshipField: {
        ref: 'id',
        included: false,
    },
    aggregateField: {
        ref: 'id',
        included: false,
    },
    groupByField: {
        ref: 'id',
        included: false,
    },
    dashboard: {
        ref: 'id',
        included: false,
    },
    viewEdit: {
        ref: 'id',
        included: false,
    },
    numeratorChart: {
        ref: 'id',
        included: false,
    },
    denominatorChart: {
        ref: 'id',
        included: false,
    },
    keyForAttribute: 'underscore_case',
    typeForAttribute(type) {
        if (type === 'sourceCollection') {
            return 'collections';
        }

        if (type === 'aggregateField') {
            return 'fields';
        }

        if (type === 'groupByField') {
            return 'fields';
        }

        if (type === 'labelField') {
            return 'fields';
        }

        if (type === 'relationshipField') {
            return 'fields';
        }

        if (type === 'numeratorChart') {
            return 'charts';
        }

        if (type === 'denominatorChart') {
            return 'charts';
        }

        return undefined;
    },
};

const JSONAPISerializer = require('../lib/serializer');

function evaluateObjectSize(obj) {
    if (!obj) return 0;

    return Object.keys(obj).reduce((acc, curr) => {
        if (typeof obj[curr] === 'object') return 1 + acc + evaluateObjectSize(obj[curr]);

        return 1 + acc;
    }, 0);
}

function createSerializer() {
    return new JSONAPISerializer('renderings', {
        attributes: [
            'isLiveDemo',
            'environment',
            'team',
            'collections',
            'charts',
            'activityLogs',
            'dashboards',
            'sections',
            'notesCreated',
            'notesMentioned',
            'approvalsCreated',
            'approvalsToApprove',
            'approvalsClosed',
            'collectionsPositions',
            'workspaces',
        ],
        activityLogs: {
            ref: 'id',
            included: false,
            ignoreRelationshipData: true,
            nullIfMissing: true,
            relationshipLinks: {
                related(record) {
                    return `/api/rendering/${record.id}/activity-logs`;
                },
            },
        },
        notesCreated: {
            ref: 'id',
            included: false,
            ignoreRelationshipData: true,
            nullIfMissing: true,
            relationshipLinks: {
                related(record) {
                    return `/api/renderings/${record.id}/notes-created`;
                },
            },
        },
        notesMentioned: {
            ref: 'id',
            included: false,
            ignoreRelationshipData: true,
            nullIfMissing: true,
            relationshipLinks: {
                related(record) {
                    return `/api/renderings/${record.id}/notes-mentioned`;
                },
            },
        },
        team: {
            ref: 'id',
            included: false,
            ignoreRelationshipData: true,
            relationshipLinks: {
                related(record, current) {
                    return `/api/teams/${current.id}`;
                },
            },
        },
        environment: {
            ref: 'id',
            included: false,
            ignoreRelationshipData: true,
            relationshipLinks: {
                related(record, current) {
                    return `/api/environments/${current.id}`;
                },
            },
        },
        collections: {
            ref: 'id',
            attributes: [
                'name',
                'displayName',
                'displayNamePlural',
                'displayField',
                'icon',
                'fields',
                'onlyForRelationships',
                'isHidden',
                'position',
                'isVirtual',
                'showCreate',
                'showUpdate',
                'showDelete',
                'restrictedToSegments',
                'paginationType',
                'viewLists',
                'modelCustomizations',
                'viewCreate',
                'viewEdit',
                'notes',
                'columns',
                'customActions',
                'segments',
                'defaultSortingFieldOrder',
                'defaultSortingField',
                'isSearchable',
                'isExportable',
                'mentionables',
                'isShowable',
                'isSearchableToEdit',
                'scope',
            ],
            segments: {
                ref: 'id',
                attributes: [
                    'name',
                    'type',
                    'collection',
                    'position',
                    'isVisible',
                    'filter',
                    'query',
                    'defaultSortingFieldOrder',
                    'defaultSortingField',
                    'hasColumnsConfiguration',
                    'columns',
                ],
                collection: {
                    ref: 'id',
                    included: false,
                },
                defaultSortingField: {
                    ref: 'id',
                    included: false,
                },
                columns: schemaColumn,
            },
            notes: {
                ref: 'id',
                included: false,
                ignoreRelationshipData: true,
                nullIfMissing: true,
                relationshipLinks: {
                    related(record, current, parent) {
                        return `/api/collections/${parent.id}/notes`;
                    },
                },
            },
            mentionables: {
                ref: 'id',
                included: false,
                ignoreRelationshipData: true,
                nullIfMissing: true,
                relationshipLinks: {
                    related(record, current, parent) {
                        return `/api/collections/${parent.id}/mentionables`;
                    },
                },
            },
            customActions: schemaCustomAction,
            columns: schemaColumn,
            modelCustomizations: {
                ref: 'id',
                included: false,
                ignoreRelationshipData: true,
                nullIfMissing: true,
                relationshipLinks: {
                    related(record, current, parent) {
                        return `/api/environments/${record.environmentId}/models/${parent.id}/model-customizations`;
                    },
                },
            },
            viewLists: {
                ref: 'id',
                included: false,
                ignoreRelationshipData: true,
                nullIfMissing: true,
                relationshipLinks: {
                    related(record, current, parent) {
                        return `/api/collections/${parent.id}/view-lists`;
                    },
                },
            },
            displayField: {
                ref: 'id',
                included: false,
            },
            defaultSortingField: {
                ref: 'id',
                included: false,
            },
            viewEdit: {
                ref: 'id',
                attributes: ['summaryView', 'rowEdits', 'charts'],
                rowEdits: schemaRowEdit,
                charts: schemaChart,
            },
            viewCreate: {
                ref: 'id',
                attributes: ['id', 'rowCreates'],
                rowCreates: schemaRowCreate,
            },
            fields: {
                ref: 'id',
                attributes: [
                    'defaultValue',
                    'description',
                    'displayName',
                    'enums',
                    'field',
                    'integration',
                    'inverseOf',
                    'isFilterable',
                    'canFilter',
                    'isFilterDisplayed',
                    'isReadOnly',
                    'isRequired',
                    'isSortable',
                    'isVirtual',
                    'mappingValues',
                    'conditionalFormatting',
                    'reference',
                    'relationship',
                    'type',
                    'validations',
                    'widgetDisplay',
                    'widgetEdit',
                    'foreignAndPrimaryKey',
                    'isPrimaryKey',
                ],
                validations: {
                    ref: 'id',
                    attributes: ['type', 'value', 'message'],
                },
            },
            scope: {
                ref: 'id',
                attributes: ['type', 'filter'],
            },
        },
        dashboards: {
            ref: 'id',
            attributes: ['id', 'name', 'charts', 'position', 'icon'],
            charts: schemaChart,
        },
        workspaces: {
            ref: 'id',
            attributes: ['id', 'name', 'components', 'position', 'icon'],
            components: {
                ref: 'id',
                attributes: ['id', 'name', 'type', 'displaySettings', 'options', 'visibility'],
            },
        },
        keyForAttribute: 'underscore_case',
        typeForAttribute(type) {
            if (type === 'subField') {
                return 'fields';
            }

            if (type === 'sourceCollection') {
                return 'collections';
            }

            if (type === 'aggregateField') {
                return 'fields';
            }

            if (type === 'groupByField') {
                return 'fields';
            }

            if (type === 'displayField') {
                return 'fields';
            }

            if (type === 'defaultSortingField') {
                return 'fields';
            }

            if (type === 'defaultEnvironment') {
                return 'environments';
            }

            if (type === 'approvers') {
                return 'users';
            }

            if (type === 'labelField') {
                return 'fields';
            }

            if (type === 'relationshipField') {
                return 'fields';
            }

            if (type === 'numeratorChart') {
                return 'charts';
            }

            if (type === 'denominatorChart') {
                return 'charts';
            }

            if (type === 'components') {
                return 'workspace-components';
            }

            return undefined;
        },
    });
}

const serializer = createSerializer();

function run(name){
    const layout = require(`./assets/layout-${name}.json`);
    let duration = [];
    for(let i = 0; i < 10; i++) {
        const startTime = performance.now();
        serializer.serialize(layout);
        const endTime = performance.now();
        duration.push(endTime - startTime);
    }
    const durationAvg = duration.reduce((a, b) => a + b, 0) / duration.length;
    console.log(`layout-${name}, props: ${evaluateObjectSize(layout)}, length: ${durationAvg} ms, props/ms: ${Math.floor(evaluateObjectSize(layout) / durationAvg)}`);
}

run(1);
run(2);
run(3);
run(4);
run(5);
run(6);
run(7);
run(8);
run(9);
run(10);



