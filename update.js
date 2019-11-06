;(async () => {
  const fs = require('fs')
  const axios = require('axios')
  require('dotenv').config()

  const ipDescription = process.env.RULEDESCRIPTION
  const recentIpFilename = process.env.RECENTIPFILENAME
  const logFilename = process.env.LOGFILENAME

  //Get current public IP
  const newIp = (await axios.get('https://api.ipify.org')).data + '/32'
  let recentIp

  try {
    recentIp = fs.readFileSync(recentIpFilename, 'utf8')
  } catch (err) {
    console.log(`Couldn't find recent IP on file, so assuming it has changed.`)
    recentIp = '0.0.0.0/32'
  }
  fs.writeFileSync(recentIpFilename, newIp)

  if (recentIp === newIp) {
    console.log(`IP hasn't changed, nothing to do.`)
    return
  } else {
    console.log(`IP has changed! Update stuff.`)
    fs.appendFileSync(
      logFilename,
      new Date().toLocaleString() + ' IP Changed\n'
    )
  }

  //Setup
  const EC2 = require('aws-sdk/clients/ec2')

  let ec2 = new EC2({
    region: process.env.AWSREGION,
    credentials: {
      accessKeyId: process.env.AWSACCESSKEYID,
      secretAccessKey: process.env.AWSSECRETACCESSKEY,
    },
  })

  let allResults = await ec2.describeSecurityGroups().promise()
  let rules = { revoke: [], add: [] }
  allResults.SecurityGroups.map(group => {
    group.IpPermissions.map(rule => {
      rule.IpRanges.map(item => {
        let IpRanges = []
        if (
          typeof item.Description !== 'undefined' &&
          item.Description.includes(process.env.RULEDESCRIPTION)
        ) {
          IpRanges.push(item)
        }
        if (IpRanges.length > 0) {
          let { FromPort, ToPort, IpProtocol } = rule
          rules.revoke.push({
            GroupId: group.GroupId,
            IpPermissions: [
              {
                FromPort,
                ToPort,
                IpProtocol,
                IpRanges,
              },
            ],
          })
          rules.add.push({
            GroupId: group.GroupId,
            IpPermissions: [
              {
                FromPort,
                ToPort,
                IpProtocol,
                IpRanges: [{ CidrIp: newIp, Description: ipDescription }],
              },
            ],
          })
        }
      })
    })
  })

  let revokeResults = await Promise.all(
    rules.revoke.map(revokeParams => {
      return ec2.revokeSecurityGroupIngress(revokeParams).promise()
    })
  )

  let authResults = await Promise.all(
    rules.add.map(params => {
      return ec2.authorizeSecurityGroupIngress(params).promise()
    })
  )

  const updateMessage = `Removed ${revokeResults.length} rules and created ${authResults.length} new ones.\n`
  // ${JSON.stringify(revokeResults)}, ${JSON.stringify(
  //   authResults
  // )} \n\n`
  fs.appendFileSync(logFilename, updateMessage)
})()
