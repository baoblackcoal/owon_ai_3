console.log('test_ts.ts');

const sessionIdPattern = /<session_id>(.*?)<\/session_id>/;

const text = `提供的信息，编号"41"可能与ADS系列示波器的以下功能相关：

1. **频率计统计功能**（参见文档[4]）：
   - 功能41对应频率计的统计功能，当该功能开启时，频率计会显示测量类型、最大值、最小值、平均值等参数。
   - 操作方法：点击频率计信息显示栏右上角的开关图标（Type:频率）可直接开启/关闭统计功能<ref>[4]</ref>。

2. **第N边沿触发设置**（参见文档[2]）：
   - 文档中提到"第N边沿触发"的设置界面显示"41"，可能与触发条件的参数配置相关（如空闲时间、边沿类型等）<ref>[2]</ref>。

如果需要进一步帮助，请提供更多上下文信息。若以上内容未解决您的问题，建议查阅《ADS800A系列用户手册》或联系利利普OWON官方技术支持<ref>[4]</ref>。
<session_id>f4a7a701da154354bc7107fe646cb6e2</session_id>`;

const sessionMatch = text.match(sessionIdPattern);

console.log('sessionMatch: ', sessionMatch);